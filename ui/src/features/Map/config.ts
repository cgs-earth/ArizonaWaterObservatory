/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { DataDrivenPropertyValueSpecification, LayerSpecification, Map, Popup } from 'mapbox-gl';
import { Root } from 'react-dom/client';
import { CustomListenerFunction, MainLayerDefinition } from '@/components/Map/types';
import { getMessage } from './utils';

export const MAP_ID = 'main-map';

export enum LayerId {
  DrawCold = 'mapbox-gl-draw-cold',
  DrawHot = 'mapbox-gl-draw-hot',
}

export enum SubLayerId {
  PolygonFillCold = 'gl-draw-polygon-fill.cold',
  LinesCold = 'gl-draw-lines.cold',
  PointOuterCold = 'gl-draw-point-outer.cold',
  PointInnerCold = 'gl-draw-point-inner.cold',
  VertexOuterCold = 'gl-draw-vertex-outer.cold',
  VertexInnerCold = 'gl-draw-vertex-inner.cold',
  MidpointCold = 'gl-draw-midpoint.cold',

  PolygonFillHot = 'gl-draw-polygon-fill.hot',
  LinesHot = 'gl-draw-lines.hot',
  PointOuterHot = 'gl-draw-point-outer.hot',
  PointInnerHot = 'gl-draw-point-inner.hot',
  VertexOuterHot = 'gl-draw-vertex-outer.hot',
  VertexInnerHot = 'gl-draw-vertex-inner.hot',
  MidpointHot = 'gl-draw-midpoint.hot',
}

export const allLayerIds = [];

/**********************************************************************
 * Define the various datasources this map will use
 **********************************************************************/

/**********************************************************************
 * Create helper functions to group layer logic
 **********************************************************************/
/**
 * Returns the display name for a given layer or sublayer based on its identifier.
 *
 * Parameters:
 * - layerId: LayerId | SubLayerId - The identifier for the layer or sublayer.
 *
 * Returns:
 * - string - The display name for the specified layer or sublayer.
 *
 * @function
 */
export const getLayerName = (layerId: LayerId | SubLayerId): string => {
  switch (layerId) {
    default:
      return '';
  }
};

/**
 * Returns the color for a given layer or sublayer based on its identifier.
 * It defines the color values for each layer, including special cases for data-driven properties.
 *
 * Parameters:
 * - id: LayerId | SubLayerId - The identifier for the layer or sublayer.
 *
 * Returns:
 * - DataDrivenPropertyValueSpecification<string> - The color value or expression for the specified layer or sublayer.
 *
 * @function
 */
export const getLayerColor = (
  id: LayerId | SubLayerId
): DataDrivenPropertyValueSpecification<string> => {
  switch (id) {
    default:
      return '#FFF';
  }
};

/**
 * Returns the configuration for a given layer or sublayer in the map.
 * It defines the properties such as id, type, source, layout, filter, and paint for each layer.
 *
 * Parameters:
 * - id: LayerId | SubLayerId - The identifier for the layer or sublayer.
 *
 * Returns:
 * - LayerSpecification | null - The configuration object for the specified layer or sublayer, or null if no configuration is needed.
 *
 * @function
 */
export const getLayerConfig = (id: LayerId | SubLayerId): null | LayerSpecification => {
  switch (id) {
    default:
      return null;
  }
};

// Define and hover functions with curry-ed map and popup objects
export const getLayerHoverFunction = (id: LayerId | SubLayerId): CustomListenerFunction => {
  return (
    map: Map,
    hoverPopup: Popup,
    persistentPopup: Popup,
    draw: MapboxDraw | null,
    root: Root,
    container: HTMLDivElement
  ) => {
    switch (id) {
      case SubLayerId.PolygonFillCold:
      case SubLayerId.LinesCold:
      case SubLayerId.PointOuterCold:
      case SubLayerId.PointInnerCold:
      case SubLayerId.VertexOuterCold:
      case SubLayerId.VertexInnerCold:
      case SubLayerId.MidpointCold:
      case SubLayerId.PolygonFillHot:
      case SubLayerId.LinesHot:
      case SubLayerId.PointOuterHot:
      case SubLayerId.PointInnerHot:
      case SubLayerId.VertexOuterHot:
      case SubLayerId.VertexInnerHot:
      case SubLayerId.MidpointHot:
        return (e) => {
          if (!draw) {
            return;
          }
          const feature = e.features?.[0];
          if (feature && feature.properties && feature.properties?.active) {
            const active = feature.properties.active === 'true';
            const mode = draw.getMode();

            const message = getMessage(id, active, mode);
            if (message.length > 0) {
              const html = `<strong style="color:black;">${message}</strong>`;
              hoverPopup.setLngLat(e.lngLat).setHTML(html).addTo(map);
            }
          }
        };

      default:
        return (e) => {
          console.log('Hover Event Triggered: ', e);
          console.log('The map: ', map);
          console.log('Available Popups: ');
          console.log('Hover: ', hoverPopup);
          console.log('Persistent: ', persistentPopup);
          console.log('Draw: ', draw);
          console.log('Content Root: ', root);
          console.log('Content Container: ', container);

          map.getCanvas().style.cursor = 'pointer';
        };
    }
  };
};

/**
 * Custom functionality for when the `mouseleave` event fires on this layer.
 * If not defined, defaults to unsetting the cursor and removing the hoverpopup
 *
 * Parameters:
 * - id: LayerId | SubLayerId - The identifier for the layer or sublayer.
 *
 * Returns:
 * - CustomListenerFunction - A function that handles the hover exit event for the specified layer or sublayer.
 *
 * @function
 */
export const getLayerCustomHoverExitFunction = (
  id: LayerId | SubLayerId
): CustomListenerFunction => {
  return (
    map: Map,
    hoverPopup: Popup,
    persistentPopup: Popup,
    draw: MapboxDraw | null,
    root: Root,
    container: HTMLDivElement
  ) => {
    switch (id) {
      default:
        return (e) => {
          console.log('Hover Exit Event Triggered: ', e);
          console.log('The map: ', map);
          console.log('Available Popups: ');
          console.log('Hover: ', hoverPopup);
          console.log('Persistent: ', persistentPopup);
          console.log('Draw: ', draw);
          console.log('Content Root: ', root);
          console.log('Content Container: ', container);
        };
    }
  };
};

/**
 * Custom functionality for when the `mousemove` event fires on this layer. This event is triggered when
 * hovering over features without the cursor leaving the layer.
 *
 * Parameters:
 * - id: LayerId | SubLayerId - The identifier for the layer or sublayer.
 *
 * Returns:
 * - CustomListenerFunction - A function that handles the mouse move event for the specified layer or sublayer.
 *
 * @function
 */
export const getLayerMouseMoveFunction = (id: LayerId | SubLayerId): CustomListenerFunction => {
  return (
    map: Map,
    hoverPopup: Popup,
    persistentPopup: Popup,
    draw: MapboxDraw | null,
    root: Root,
    container: HTMLDivElement
  ) => {
    switch (id) {
      case SubLayerId.PolygonFillCold:
      case SubLayerId.LinesCold:
      case SubLayerId.PointOuterCold:
      case SubLayerId.PointInnerCold:
      case SubLayerId.VertexOuterCold:
      case SubLayerId.VertexInnerCold:
      case SubLayerId.MidpointCold:
      case SubLayerId.PolygonFillHot:
      case SubLayerId.LinesHot:
      case SubLayerId.PointOuterHot:
      case SubLayerId.PointInnerHot:
      case SubLayerId.VertexOuterHot:
      case SubLayerId.VertexInnerHot:
      case SubLayerId.MidpointHot:
        return (e) => {
          if (!draw) {
            return;
          }
          const feature = e.features?.[0];
          if (feature && feature.properties && feature.properties?.active) {
            const active = feature.properties.active === 'true';
            const mode = draw.getMode();

            const message = getMessage(id, active, mode);
            if (message.length > 0) {
              const html = `<strong style="color:black;">${message}</strong>`;
              hoverPopup.setLngLat(e.lngLat).setHTML(html).addTo(map);
            }
          }
        };

      default:
        return (e) => {
          console.log('Hover Exit Event Triggered: ', e);
          console.log('The map: ', map);
          console.log('Available Popups: ');
          console.log('Hover: ', hoverPopup);
          console.log('Persistent: ', persistentPopup);
          console.log('Draw: ', draw);
          console.log('Content Root: ', root);
          console.log('Content Container: ', container);
        };
    }
  };
};

/**
 * Custom functionality for when the `click` event fires on this layer.
 *
 * Parameters:
 * - id: LayerId | SubLayerId - The identifier for the layer or sublayer.
 *
 * Returns:
 * - CustomListenerFunction - A function that handles the click event for the specified layer or sublayer.
 *
 * @function
 */
export const getLayerClickFunction = (id: LayerId | SubLayerId): CustomListenerFunction => {
  return (
    map: Map,
    hoverPopup: Popup,
    persistentPopup: Popup,
    draw: MapboxDraw | null,
    root: Root,
    container: HTMLDivElement
  ) => {
    switch (id) {
      default:
        return (e) => {
          console.log('Click Event Triggered: ', e);
          console.log('The map: ', map);
          console.log('Available Popups: ');
          console.log('Hover: ', hoverPopup);
          console.log('Persistent: ', persistentPopup);
          console.log('Draw: ', draw);
          console.log('Content Root: ', root);
          console.log('Content Container: ', container);
        };
    }
  };
};

/**
 * Contains the definitions for main layers and sublayers in the map.
 * Each layer definition includes properties such as id, controllable, legend, config, and optional event handler functions.
 *
 * LayerDefinition Type:
 * - id: string - The identifier for the layer or sublayer.
 * - controllable: boolean - Whether the layers visibility can be toggled by the user.
 * - legend: boolean - Whether the layer should be displayed in the legend.
 * - config: LayerSpecification | null - The configuration object for the layer or sublayer.
 * - hoverFunction?: CustomListenerFunction - Optional function to handle hover events.
 * - customHoverExitFunction?: CustomListenerFunction - Optional function to handle hover exit events.
 * - clickFunction?: CustomListenerFunction - Optional function to handle click events.
 * - mouseMoveFunction?: CustomListenerFunction - Optional function to handle mouse move events.
 *
 * MainLayerDefinition Type:
 * Contains the above type values and an additional optional array
 * - subLayers?: LayerDefinition[] - Optional array of sublayer definitions.
 *
 *
 * @constant
 */
export const layerDefinitions: MainLayerDefinition[] = [
  // Use this as the master object to define layer hierarchies. Sublayers are nested layer definitions,
  // meaning they have their own click and hover listeners. The order of layers and sublayers dictates the draw
  // order on the map.
  {
    id: LayerId.DrawCold,
    controllable: false,
    legend: false,
    config: getLayerConfig(LayerId.DrawCold),
    subLayers: [
      {
        id: SubLayerId.PolygonFillCold,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.PolygonFillCold),
        hoverFunction: getLayerHoverFunction(SubLayerId.PolygonFillCold),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.PolygonFillCold),
      },
      {
        id: SubLayerId.LinesCold,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.LinesCold),
        hoverFunction: getLayerHoverFunction(SubLayerId.LinesCold),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.LinesCold),
      },
      {
        id: SubLayerId.PointOuterCold,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.PointOuterCold),
        hoverFunction: getLayerHoverFunction(SubLayerId.PointOuterCold),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.PointOuterCold),
      },
      {
        id: SubLayerId.PointInnerCold,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.PointInnerCold),
        hoverFunction: getLayerHoverFunction(SubLayerId.PointInnerCold),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.PointInnerCold),
      },
      {
        id: SubLayerId.VertexOuterCold,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.VertexOuterCold),
        hoverFunction: getLayerHoverFunction(SubLayerId.VertexOuterCold),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.VertexOuterCold),
      },
      {
        id: SubLayerId.VertexInnerCold,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.VertexInnerCold),
        hoverFunction: getLayerHoverFunction(SubLayerId.VertexInnerCold),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.VertexInnerCold),
      },
      {
        id: SubLayerId.MidpointCold,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.MidpointCold),
        hoverFunction: getLayerHoverFunction(SubLayerId.MidpointCold),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.MidpointCold),
      },
    ],
  },
  {
    id: LayerId.DrawHot,
    controllable: false,
    legend: false,
    config: getLayerConfig(LayerId.DrawHot),
    subLayers: [
      {
        id: SubLayerId.PolygonFillHot,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.PolygonFillHot),
        hoverFunction: getLayerHoverFunction(SubLayerId.PolygonFillHot),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.PolygonFillHot),
      },
      {
        id: SubLayerId.LinesHot,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.LinesHot),
        hoverFunction: getLayerHoverFunction(SubLayerId.LinesHot),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.LinesHot),
      },
      {
        id: SubLayerId.PointOuterHot,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.PointOuterHot),
        hoverFunction: getLayerHoverFunction(SubLayerId.PointOuterHot),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.PointOuterHot),
      },
      {
        id: SubLayerId.PointInnerHot,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.PointInnerHot),
        hoverFunction: getLayerHoverFunction(SubLayerId.PointInnerHot),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.PointInnerHot),
      },
      {
        id: SubLayerId.VertexOuterHot,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.VertexOuterHot),
        hoverFunction: getLayerHoverFunction(SubLayerId.VertexOuterHot),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.VertexOuterHot),
      },
      {
        id: SubLayerId.VertexInnerHot,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.VertexInnerHot),
        hoverFunction: getLayerHoverFunction(SubLayerId.VertexInnerHot),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.VertexInnerHot),
      },
      {
        id: SubLayerId.MidpointHot,
        controllable: false,
        legend: false,
        config: getLayerConfig(SubLayerId.MidpointHot),
        hoverFunction: getLayerHoverFunction(SubLayerId.MidpointHot),
        mouseMoveFunction: getLayerMouseMoveFunction(SubLayerId.MidpointHot),
      },
    ],
  },
];
