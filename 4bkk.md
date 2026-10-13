# walk(): short non-CESR input is reported as retryable incomplete (bakobo/cesrview#6 hostile pass). Under SMELLSIZE (27) bytes with no version token, walk() returns incomplete/permanent:false even when no offset 0..8 could start a token (e.g. 26 '@' bytes). Faithful to keripy smell (ShortageError on len<SMELLSIZE, kering.py:227), where the cold-start ColdCodex sniff on byte 0 rejects garbage first. Fix: add a cold-start first-byte sniff, or a prefix-feasibility check that returns no-version-string once no position <= MAXVSOFFSET can still begin [A-Z]{4}.
kind: debt
tags: review-deferred
created: 2026-10-13T03:58Z

