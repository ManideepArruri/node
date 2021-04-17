// Copyright 2018 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --expose-gc --noincremental-marking

let cleanup_call_count = 0;
let cleanup_holdings_count = 0;
let cleanup = function(holdings) {
  assertEquals("holdings", holdings);
  ++cleanup_holdings_count;
  ++cleanup_call_count;
}

let fg = new FinalizationRegistry(cleanup);
let key = {"k": "this is the key"};
// Create an object and register it in the FinalizationRegistry. The object needs
// to be inside a closure so that we can reliably kill them!

(function() {
  let object = {};
  fg.register(object, "holdings", key);

  // object goes out of scope.
})();

// This GC will reclaim the target object and schedule cleanup.
gc();
assertEquals(0, cleanup_call_count);

// Assert that the cleanup function was called.
let timeout_func = function() {
  assertEquals(1, cleanup_call_count);
  assertEquals(1, cleanup_holdings_count);

  // Unregister an already cleaned-up weak reference.
  let success = fg.unregister(key);
  assertFalse(success);

  // Assert that it didn't do anything.
  setTimeout(() => { assertEquals(1, cleanup_call_count); }, 0);
  setTimeout(() => { assertEquals(1, cleanup_holdings_count); }, 0);
}

setTimeout(timeout_func, 0);
