#!/usr/bin/env python3
"""
CRIMENEXUS Consolidated Automation Test Runner.
Executes all 8 automation test suites (40 tests total) across the full backend stack:
1. FIR-to-Graph
2. Smurfing Detection
3. CDR Movement Map
4. RAG Drafting
5. Police Proximity
6. Video ANPR
7. Streaming Ingestion
8. Most Wanted
"""

import os
import sys
import time
import inspect

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from tests.automations import (
    test_automation_fir_to_graph,
    test_automation_smurfing_detection,
    test_automation_cdr_movement_map,
    test_automation_rag_drafting,
    test_automation_police_proximity,
    test_automation_video_anpr,
    test_automation_streaming_ingestion,
    test_automation_most_wanted
)


SUITES = [
    ("FIR-to-Graph", test_automation_fir_to_graph),
    ("Smurfing Detection", test_automation_smurfing_detection),
    ("CDR Movement Map", test_automation_cdr_movement_map),
    ("RAG Drafting", test_automation_rag_drafting),
    ("Police Proximity", test_automation_police_proximity),
    ("Video ANPR", test_automation_video_anpr),
    ("Streaming Ingestion", test_automation_streaming_ingestion),
    ("Most Wanted", test_automation_most_wanted),
]


def run_all_automations():
    print("\n" + "=" * 80)
    print("CRIMENEXUS COMPREHENSIVE AUTOMATION PROOF RUNNER (40 / 40 TESTS)")
    print("=" * 80 + "\n")

    suite_results = []
    total_all = 0
    passed_all = 0

    t_suite_start = time.time()

    for name, module in SUITES:
        print(f"[*] Running Automation Suite: {name}...")
        test_funcs = [
            f for f_name, f in inspect.getmembers(module, inspect.isfunction)
            if f_name.startswith("test_")
        ]

        total_in_suite = len(test_funcs)
        passed_in_suite = 0

        for func in test_funcs:
            f_name = func.__name__
            try:
                func()
                passed_in_suite += 1
                print(f"    [+] {f_name} ... PASSED")
            except Exception as exc:
                print(f"    [-] {f_name} ... FAILED: {exc}")

        suite_results.append((name, total_in_suite, passed_in_suite))
        total_all += total_in_suite
        passed_all += passed_in_suite
        print(f"    -> Suite Score: {passed_in_suite}/{total_in_suite}\n")

    t_suite_duration = time.time() - t_suite_start

    # Print Table
    print("\n" + "┌" + "─" * 37 + "┬" + "─" * 8 + "┬" + "─" * 8 + "┐")
    print(f"│ {'Automation':<35} │ {'Total':<6} │ {'Passed':<6} │")
    print("├" + "─" * 37 + "┼" + "─" * 8 + "┼" + "─" * 8 + "┤")
    for name, total, passed in suite_results:
        print(f"│ {name:<35} │ {total:<6} │ {passed:<6} │")
    print("├" + "─" * 37 + "┼" + "─" * 8 + "┼" + "─" * 8 + "┤")
    print(f"│ {'TOTAL':<35} │ {total_all:<6} │ {passed_all:<6} │")
    print("└" + "─" * 37 + "┴" + "─" * 8 + "┴" + "─" * 8 + "┘")

    print(f"\nExecution Duration: {t_suite_duration:.2f} seconds.")
    if passed_all == total_all:
        print("SUCCESS: 100% OF AUTOMATION TESTS PASSED (40/40).\n")
        return 0
    else:
        print(f"FAILURE: {total_all - passed_all} tests failed.\n")
        return 1


if __name__ == "__main__":
    exit_code = run_all_automations()
    sys.exit(exit_code)
