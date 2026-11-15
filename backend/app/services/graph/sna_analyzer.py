import networkx as nx
from typing import Dict, List, Any, Tuple

class SNAGangAnalyzer:
    """
    Social Network Analysis (SNA) for Gang Intervention & Leadership Neutralization.
    Computes NetworkX degree centrality, betweenness, clustering coefficients,
    and identifies critical 'cut-points' (articulation points) whose removal
    fragments or collapses the criminal syndicate network.
    """

    def __init__(self):
        pass

    def build_graph(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> nx.Graph:
        G = nx.Graph()
        for node in nodes:
            G.add_node(node["id"], **node)
        for edge in edges:
            G.add_edge(edge["source"], edge["target"], weight=edge.get("weight", 1.0), relation=edge.get("relation", "ASSOCIATE"))
        return G

    def analyze_network(self, G: nx.Graph) -> Dict[str, Any]:
        if len(G) == 0:
            return {
                "total_nodes": 0,
                "total_edges": 0,
                "density": 0.0,
                "cut_points": [],
                "node_metrics": {},
                "removal_impact": []
            }

        # Centrality metrics
        deg_centrality = nx.degree_centrality(G)
        betweenness = nx.betweenness_centrality(G, normalized=True)
        clustering = nx.clustering(G)
        
        # Articulation points (Cut-points)
        cut_points = list(nx.articulation_points(G))

        initial_components = nx.number_connected_components(G)

        # Removal Impact Evaluation
        removal_impact = []
        for node_id in G.nodes():
            H = G.copy()
            H.remove_node(node_id)
            new_components = nx.number_connected_components(H) if len(H) > 0 else 0
            
            # Impact score: 0 to 100 based on network fragmentation & betweenness
            frag_delta = max(0, new_components - initial_components)
            b_score = betweenness.get(node_id, 0.0)
            d_score = deg_centrality.get(node_id, 0.0)
            
            # Weighted formula: Fragmentation factor (50%) + Betweenness (30%) + Degree (20%)
            impact_score = min(100.0, round((frag_delta * 35.0) + (b_score * 45.0) + (d_score * 20.0), 1))
            
            removal_impact.append({
                "node_id": node_id,
                "name": G.nodes[node_id].get("name", node_id),
                "role": G.nodes[node_id].get("role", "Operative"),
                "is_cut_point": node_id in cut_points,
                "betweenness": round(b_score, 4),
                "degree_centrality": round(d_score, 4),
                "clustering_coef": round(clustering.get(node_id, 0.0), 4),
                "components_after_removal": new_components,
                "removal_impact_score": impact_score,
                "recommendation": "PRIORITY_INTERVENTION_CUTPOINT" if node_id in cut_points else ("HIGH_LEADERSHIP_TARGET" if b_score > 0.3 else "MONITOR")
            })

        removal_impact.sort(key=lambda x: x["removal_impact_score"], reverse=True)

        node_metrics = {
            n: {
                "degree_centrality": round(deg_centrality[n], 4),
                "betweenness": round(betweenness[n], 4),
                "clustering": round(clustering[n], 4),
                "is_cut_point": n in cut_points
            }
            for n in G.nodes()
        }

        return {
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "density": round(nx.density(G), 4),
            "initial_components": initial_components,
            "cut_points": cut_points,
            "node_metrics": node_metrics,
            "removal_impact": removal_impact
        }

_sna_instance = SNAGangAnalyzer()

def get_sna_analyzer() -> SNAGangAnalyzer:
    return _sna_instance
