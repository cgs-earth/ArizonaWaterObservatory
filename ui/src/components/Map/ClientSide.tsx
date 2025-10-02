/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl, { Map as _Map, IControl } from 'mapbox-gl';
import { MapComponentProps } from '@/components/Map/types';
import {
  addClickFunctions,
  addControls,
  addCustomControls,
  addHoverFunctions,
  addLayers,
  addMouseMoveFunctions,
  addSources,
} from '@/components/Map/utils';
import { useMap } from '@/contexts/MapContexts';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import FeatureService, { FeatureServiceOptions } from '@hansdo/mapbox-gl-arcgis-featureserver';
import { createRoot } from 'react-dom/client';

FeatureService.prototype._setAttribution = function () {
  // Stub to prevent attribution bug
};

/**
 * This component initializes and renders a Mapbox GL map with specified sources, layers, and controls.
 * It handles map loading, style changes, and cleanup on component unmount. Once the map is initialized
 * it the map object is stored into the map context provider to allow referencing across the application.
 *
 * Props:
 * - accessToken: string - The access token for the Mapbox service.
 * - id: string - The unique identifier for the map component.
 * - sources: SourceConfig[] - Array of source configurations for the map.
 * - layers: MainLayerDefinition[] - Array of layer definitions for the map.
 * - options: Omit<MapOptions, 'container'> - Map options excluding the container property.
 *   Container is defined by this component.
 * - controls?: {
 *     navigationControl?: NavigationControlOptions | boolean;
 *     scaleControl?: ScaleControlOptions | boolean;
 *     fullscreenControl?: FullscreenControlOptions | boolean;
 * } - Optional map controls configuration.
 * - persist?: boolean - Optional boolean to not remove this map instance. WARNING: the map instance must
 *  be removed manually to prevent memory leak.
 *
 * @component
 */
const MapComponent: React.FC<MapComponentProps> = (props) => {
  const {
    id,
    sources,
    layers,
    options,
    controls,
    customControls,
    accessToken,
    persist = false,
    geocoder,
    draw,
  } = props;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const {
    map,
    hoverPopup,
    persistentPopup,
    draw: drawInstance,
    root,
    container,
    setMap,
  } = useMap(id);

  useEffect(() => {
    if (!map && mapContainerRef.current) {
      mapboxgl.accessToken = accessToken;
      const newMap = new mapboxgl.Map({
        ...options,
        container: mapContainerRef.current,
      });
      const hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      const persistentPopup = new mapboxgl.Popup();

      let _geocoder: MapboxGeocoder | null = null;
      if (geocoder) {
        const { position, ...geocoderWithoutPosition } = geocoder;
        _geocoder = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          ...geocoderWithoutPosition,
        });
        if (position) {
          newMap.addControl(_geocoder, position);
        }
      }
      let _draw: MapboxDraw | null = null;
      if (draw) {
        const { position, ...drawWithoutPosition } = draw;
        _draw = new MapboxDraw(drawWithoutPosition);
        if (position) {
          newMap.addControl(_draw as unknown as IControl, position);
        } else {
          newMap.addControl(_draw as unknown as IControl);
        }
      }

      const container = document.createElement('div');
      container.setAttribute('id', 'customPopupContent');
      const root = createRoot(container);

      newMap.once('load', () => {
        const createFeatureService = (
          sourceId: string,
          map: _Map,
          options: FeatureServiceOptions
        ) => new FeatureService(sourceId, map, options);

        setMap(newMap, hoverPopup, persistentPopup, _geocoder, _draw, root, container);
        addSources(newMap, sources, createFeatureService);
        addLayers(newMap, layers);
        addHoverFunctions(newMap, layers, hoverPopup, persistentPopup, _draw, root, container);
        addClickFunctions(newMap, layers, hoverPopup, persistentPopup, _draw, root, container);
        addMouseMoveFunctions(newMap, layers, hoverPopup, persistentPopup, _draw, root, container);
        addControls(newMap, controls);
        addCustomControls(newMap, customControls);
      });
    } else if (
      persist &&
      map &&
      mapContainerRef.current &&
      mapContainerRef.current.innerHTML.length === 0
    ) {
      const container = map.getContainer();
      const parent = container.parentNode;

      if (mapContainerRef.current && container !== mapContainerRef.current) {
        if (parent) {
          parent.removeChild(container);
        }
        mapContainerRef.current.appendChild(container);
        map.resize();
      }
    }

    return () => {
      if (!persist && map) {
        map.remove();
      }
      if (!persist && root) {
        root.unmount();
      }
    };
  }, []);

  useEffect(() => {
    if (!map || !hoverPopup || !persistentPopup || !root || !container) {
      return;
    }

    map.on('style.load', () => {
      const createFeatureService = (sourceId: string, map: _Map, options: FeatureServiceOptions) =>
        new FeatureService(sourceId, map, options);

      // Layers reset on style changes
      addSources(map, sources, createFeatureService);
      addLayers(map, layers);
      addHoverFunctions(map, layers, hoverPopup, persistentPopup, drawInstance, root, container);
      addClickFunctions(map, layers, hoverPopup, persistentPopup, drawInstance, root, container);
      addMouseMoveFunctions(
        map,
        layers,
        hoverPopup,
        persistentPopup,
        drawInstance,
        root,
        container
      );
    });
  }, [map]);

  // Style the container using #map-container-${id} in a global css file
  return (
    <div data-testid={`map-container-${id}`} id={`map-container-${id}`} ref={mapContainerRef} />
  );
};

export default MapComponent;
