# Track and support the latest keripy 2.0 changes — verify cesrview's walker/annotations against updated keripy 2.0 encodings and code tables
kind: todo
created: 2026-07-21T16:01Z

- 2026-07-22T03:07Z Walker + annotations frame CESR-2 natively (commits a6b4e94 intent, b8a9a6d code), ground-truthed to keripy 2.0.0-dev6: v2 version-string parse, genus-dispatched native v2 counter tables (CtrDex_2_0; v2 groups self-frame as count*4 quadlets), genus-aware v2 glosses (COUNTER_2). Both v2 corpus samples delta-0/fully-known; committed tiny-v2-oobi oracle fixture; 100% branch cov; build green; verified in-app (header 'KERI 2.0 JSON', clean render). Primitives still via signify-ts (genus-stable). Remaining is COLLATERAL: ship v2 samples via Examples picker; v2 signify-ts PR (7zpj).
