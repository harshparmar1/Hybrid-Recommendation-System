from __future__ import annotations

import random
from typing import Dict, List, Optional, Sequence, Set, Tuple

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity


class HybridRecommender:
    def __init__(
        self,
        csv_path: str,
        n_clusters: int = 5,
        max_users: Optional[int] = 5000,
        max_products: Optional[int] = 20000,
    ) -> None:
        self.csv_path = csv_path
        self.requested_clusters = n_clusters
        self.max_users = max_users
        self.max_products = max_products

        self.data = self._load_and_prepare_data()
        self.user_item_matrix = self._build_user_item_matrix()
        self.user_clusters = self._build_user_clusters()
        self.product_popularity = self._build_product_popularity()
        self.product_metadata = self._build_product_metadata()

    def has_user(self, user_id: int) -> bool:
        return user_id in self.user_item_matrix.index

    def sample_user_ids(self, limit: int = 10) -> List[int]:
        user_ids = list(self.user_item_matrix.index[: max(limit, 0)])
        return [int(uid) for uid in user_ids]

    def _load_and_prepare_data(self) -> pd.DataFrame:
        df = pd.read_csv(self.csv_path)

        required_cols = {"user_id", "product_id", "event_type", "brand", "category_code", "price"}
        missing = required_cols - set(df.columns)
        if missing:
            missing_text = ", ".join(sorted(missing))
            raise ValueError(f"Missing required columns in CSV: {missing_text}")

        df["brand"] = df["brand"].fillna("no_brand")
        df["category_code"] = df["category_code"].fillna("unknown_category")

        interaction_map = {"view": 1, "cart": 3, "purchase": 5}
        df["interaction"] = df["event_type"].map(interaction_map).fillna(0).astype(float)

        df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0.0)

        if self.max_users is not None and self.max_users > 0:
            top_users = df["user_id"].value_counts().head(self.max_users).index
            df = df[df["user_id"].isin(top_users)]

        if self.max_products is not None and self.max_products > 0:
            top_products = df["product_id"].value_counts().head(self.max_products).index
            df = df[df["product_id"].isin(top_products)]

        if df.empty:
            raise ValueError("Dataset became empty after filtering top users/products.")

        return df

    def _build_user_item_matrix(self) -> pd.DataFrame:
        matrix = self.data.pivot_table(
            index="user_id",
            columns="product_id",
            values="interaction",
            aggfunc="sum",
            fill_value=0,
        )
        if matrix.empty:
            raise ValueError("User-item matrix is empty.")
        return matrix

    def _compute_similarity_scores(
        self,
        user_id: int,
        candidate_users: Sequence[int],
        max_neighbors: Optional[int] = None,
    ) -> pd.Series:
        if not candidate_users:
            return pd.Series(dtype=float)

        target_vector = self.user_item_matrix.loc[[user_id]].to_numpy()
        candidate_matrix = self.user_item_matrix.loc[list(candidate_users)]
        similarities = cosine_similarity(target_vector, candidate_matrix.to_numpy()).ravel()

        scores = pd.Series(similarities, index=candidate_matrix.index, dtype=float)
        scores = scores[scores > 0]
        if max_neighbors is not None and max_neighbors > 0 and len(scores) > max_neighbors:
            scores = scores.nlargest(max_neighbors)

        return scores.sort_values(ascending=False)

    def _build_user_clusters(self) -> pd.Series:
        n_users = len(self.user_item_matrix)
        n_clusters = min(self.requested_clusters, n_users)
        if n_clusters <= 0:
            raise ValueError("No users found for clustering.")

        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(self.user_item_matrix)
        return pd.Series(labels, index=self.user_item_matrix.index, name="cluster")

    def _build_product_popularity(self) -> pd.Series:
        return self.data.groupby("product_id")["interaction"].sum().sort_values(ascending=False)

    def _build_product_metadata(self) -> pd.DataFrame:
        agg_map = {
            "category": ("category_code", "first"),
            "brand": ("brand", "first"),
            "price": ("price", "median"),
        }
        # Optional column for real product photos.
        if "image_url" in self.data.columns:
            agg_map["image_url"] = ("image_url", "first")

        metadata = self.data.groupby("product_id", as_index=True).agg(**agg_map)
        return metadata

    def _select_diverse_products(
        self,
        ranked_products: Sequence[Tuple[int, float]],
        top_n: int,
        max_per_category: int = 3,
    ) -> List[int]:
        selected: List[int] = []
        category_counts: Dict[str, int] = {}

        for product_id, _ in ranked_products:
            if product_id not in self.product_metadata.index:
                continue

            category = str(self.product_metadata.loc[product_id, "category"])
            if category_counts.get(category, 0) >= max_per_category:
                continue

            selected.append(int(product_id))
            category_counts[category] = category_counts.get(category, 0) + 1

            if len(selected) >= top_n:
                return selected

        # Fill remaining slots if diversity cap filtered too aggressively.
        selected_set = set(selected)
        for product_id, _ in ranked_products:
            if product_id in selected_set:
                continue
            if product_id not in self.product_metadata.index:
                continue

            selected.append(int(product_id))
            selected_set.add(int(product_id))
            if len(selected) >= top_n:
                break

        return selected

    def _popular_recommendations(self, top_n: int, exclude: Optional[Set[int]] = None) -> List[Dict]:
        exclude = exclude or set()
        ranked_products: List[Tuple[int, float]] = []
        scores: Dict[int, float] = {}

        for product_id, score in self.product_popularity.items():
            if product_id in exclude:
                continue
            ranked_products.append((int(product_id), float(score)))
            scores[product_id] = float(score)
            if len(ranked_products) >= max(top_n * 4, top_n):
                break

        selected = self._select_diverse_products(ranked_products, top_n=top_n, max_per_category=3)

        return self._format_recommendations(selected, scores)

    def _format_recommendations(self, product_ids: Sequence[int], scores: Dict[int, float]) -> List[Dict]:
        output: List[Dict] = []

        for product_id in product_ids:
            if product_id not in self.product_metadata.index:
                continue

            meta = self.product_metadata.loc[product_id]
            output.append(
                {
                    "product_id": int(product_id),
                    "category": str(meta["category"]),
                    "brand": str(meta["brand"]),
                    "price": round(float(meta["price"]), 2),
                    "score": round(float(scores.get(product_id, 0.0)), 4),
                    **(
                        {"image_url": str(meta["image_url"])}
                        if "image_url" in meta.index and pd.notna(meta["image_url"])
                        else {}
                    ),
                }
            )

        return output

    def recommend_for_user(self, user_id: int, top_n: int = 10) -> List[Dict]:
        if user_id not in self.user_item_matrix.index:
            return self._popular_recommendations(top_n=top_n)

        target_vector = self.user_item_matrix.loc[user_id]
        seen_products = set(target_vector[target_vector > 0].index.tolist())

        target_cluster = self.user_clusters.loc[user_id]
        cluster_users = self.user_clusters[self.user_clusters == target_cluster].index.tolist()
        similar_users = [uid for uid in cluster_users if uid != user_id]

        if not similar_users:
            return self._popular_recommendations(top_n=top_n, exclude=seen_products)

        sim_scores = self._compute_similarity_scores(user_id=user_id, candidate_users=similar_users)
        candidate_scores: Dict[int, float] = {}

        for similar_user, sim_score in sim_scores.items():
            if sim_score <= 0:
                continue

            similar_user_items = self.user_item_matrix.loc[similar_user]
            interacted_products = similar_user_items[similar_user_items > 0]

            for product_id, interaction_value in interacted_products.items():
                if product_id in seen_products:
                    continue

                weighted_score = float(sim_score) * float(interaction_value)
                candidate_scores[product_id] = candidate_scores.get(product_id, 0.0) + weighted_score

        if not candidate_scores:
            return self._popular_recommendations(top_n=top_n, exclude=seen_products)

        ranked_products = sorted(candidate_scores.items(), key=lambda item: item[1], reverse=True)
        top_product_ids = self._select_diverse_products(ranked_products, top_n=top_n, max_per_category=3)

        return self._format_recommendations(top_product_ids, candidate_scores)

    # ── Evaluation Metrics ──────────────────────────────────────────────────
    def evaluate_model(self, sample_size: int = 200, top_k: int = 10, max_neighbors: int = 60) -> Dict:
        """
        Compute evaluation metrics using hold-out evaluation.

        For each user, 20% of their interactions are held out as a test set.
        Collaborative filtering scores are computed from cluster neighbours,
        and only the held-out items are eligible as candidates.
        We then check how many of those held-out items appear in the top-K.
        """
        import numpy as np
        import random

        all_user_ids = list(self.user_item_matrix.index)
        sample_users = random.sample(all_user_ids, min(sample_size, len(all_user_ids)))

        hits = 0
        precision_sum = 0.0
        recall_sum = 0.0
        ndcg_sum = 0.0
        map_sum = 0.0
        valid_users = 0
        all_recommended_products: Set[int] = set()

        for user_id in sample_users:
            target_vector = self.user_item_matrix.loc[user_id]
            interacted = target_vector[target_vector > 0].index.tolist()

            # Need enough interactions to split
            if len(interacted) < 5:
                continue

            # Hold-out split: 20% as test, rest as train (known)
            random.shuffle(interacted)
            split = max(1, int(len(interacted) * 0.2))
            test_items = set(interacted[:split])
            train_items = set(interacted[split:])

            # --- Compute CF scores for this user ---
            target_cluster = self.user_clusters.loc[user_id]
            cluster_users = self.user_clusters[self.user_clusters == target_cluster].index.tolist()
            similar_users = [uid for uid in cluster_users if uid != user_id]

            if not similar_users:
                continue

            sim_scores = self._compute_similarity_scores(
                user_id=user_id,
                candidate_users=similar_users,
                max_neighbors=max_neighbors,
            )
            if sim_scores.empty:
                continue
            candidate_scores: Dict[int, float] = {}

            for similar_user, sim_score in sim_scores.items():
                if sim_score <= 0:
                    continue
                similar_user_items = self.user_item_matrix.loc[similar_user]
                su_interacted = similar_user_items[similar_user_items > 0]

                for product_id, interaction_value in su_interacted.items():
                    # Only exclude train items — test items ARE eligible
                    if product_id in train_items:
                        continue
                    weighted_score = float(sim_score) * float(interaction_value)
                    candidate_scores[product_id] = candidate_scores.get(product_id, 0.0) + weighted_score

            if not candidate_scores:
                continue

            # Rank and pick top-K
            ranked = sorted(candidate_scores.items(), key=lambda x: x[1], reverse=True)
            rec_ids = [pid for pid, _ in ranked[:top_k]]
            all_recommended_products.update(rec_ids)

            # --- Compute metrics ---
            rec_set = set(rec_ids)
            hit_items = rec_set & test_items

            precision = len(hit_items) / len(rec_ids) if rec_ids else 0.0
            recall = len(hit_items) / len(test_items) if test_items else 0.0

            # NDCG@K
            dcg = 0.0
            for rank, pid in enumerate(rec_ids):
                if pid in test_items:
                    dcg += 1.0 / np.log2(rank + 2)
            ideal_hits = min(len(test_items), top_k)
            idcg = sum(1.0 / np.log2(i + 2) for i in range(ideal_hits))
            ndcg = dcg / idcg if idcg > 0 else 0.0

            # MAP (Average Precision for this user)
            ap_hits = 0
            ap_sum = 0.0
            for rank, pid in enumerate(rec_ids):
                if pid in test_items:
                    ap_hits += 1
                    ap_sum += ap_hits / (rank + 1)
            avg_precision_user = ap_sum / min(len(test_items), top_k) if test_items else 0.0

            precision_sum += precision
            recall_sum += recall
            ndcg_sum += ndcg
            map_sum += avg_precision_user

            if len(hit_items) > 0:
                hits += 1

            valid_users += 1

        if valid_users == 0:
            return {"error": "Not enough users for evaluation"}

        avg_precision = precision_sum / valid_users
        avg_recall = recall_sum / valid_users
        avg_ndcg = ndcg_sum / valid_users
        avg_map = map_sum / valid_users
        f1 = (2 * avg_precision * avg_recall / (avg_precision + avg_recall)) if (avg_precision + avg_recall) > 0 else 0.0
        hit_rate = hits / valid_users
        total_products = len(self.product_metadata)
        coverage = len(all_recommended_products) / total_products if total_products > 0 else 0.0

        n_clusters = len(set(self.user_clusters.values))
        cluster_sizes = self.user_clusters.value_counts().to_dict()

        return {
            "metrics": {
                "precision_at_k":  round(avg_precision, 4),
                "recall_at_k":     round(avg_recall, 4),
                "f1_score":        round(f1, 4),
                "ndcg_at_k":       round(avg_ndcg, 4),
                "hit_rate":        round(hit_rate, 4),
                "coverage":        round(coverage, 4),
                "map_score":       round(avg_map, 4),
            },
            "config": {
                "k": top_k,
                "sample_size": valid_users,
                "n_clusters": n_clusters,
            },
            "model_stats": {
                "total_users":       len(all_user_ids),
                "total_products":    total_products,
                "total_interactions": len(self.data),
                "sparsity":          round(1.0 - (self.user_item_matrix.values.astype(bool).sum() / (self.user_item_matrix.shape[0] * self.user_item_matrix.shape[1])), 4),
                "n_clusters":        n_clusters,
                "cluster_sizes":     {str(k): v for k, v in sorted(cluster_sizes.items())},
                "avg_interactions_per_user": round(len(self.data) / len(all_user_ids), 2),
                "avg_interactions_per_product": round(len(self.data) / total_products, 2),
            },
        }
