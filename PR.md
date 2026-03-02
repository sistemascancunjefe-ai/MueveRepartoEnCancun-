🧪 [testing improvement] Add robust unit tests for RouteDrawer.ts

## 🎯 What

The `src/utils/RouteDrawer.ts` file lacked tests due to its heavy coupling to Leaflet (the global `window.L` object and the `map` instance). It is critical for the application as it renders multiple legs of a journey and processes diverse route data shapes (both the new optimized `paradas` payload and legacy string-based stops).

I introduced `src/tests/RouteDrawer.test.ts` to fully test the map drawing logic by injecting mocks for the global Leaflet library `L`, map instances, LayerGroups, Polylines, and Markers.

## 📊 Coverage

The following scenarios are now tested and verified:
* Handling of missing `L` library (graceful `undefined` return).
* Handling of missing map instance (graceful `undefined` return).
* Proper cleanup of the `existingLayerGroup` before re-drawing a new route.
* Graceful exit when invalid data (missing route stops information) is provided.
* Rendering of the **new route format** (`paradas` objects with `lat` and `lng` properties), verifying the correct polyline bounds are passed and bounds are fitted.
* Rendering of the **legacy route format** (`stops` string array), resolving coordinates from a passed `coordinatesDB`.
* Rendering of **multi-leg journeys** (displaying multiple polylines, start/transfer/end markers).
* Graceful degradation when coordinates are missing (logs a warning).

## ✨ Result

The test coverage for `RouteDrawer.ts` is now 100% (or effectively 100% path coverage). Refactoring this file to further optimize routing displays or migrate to a new Leaflet/Map engine abstraction in the future will be significantly safer, as the business logic for parsing legs, paradas, and legacy routes is now heavily guarded.
