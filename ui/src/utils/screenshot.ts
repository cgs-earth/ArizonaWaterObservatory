/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { LngLatLike, Map } from 'mapbox-gl';
import { loadImages } from '@/features/Map/utils';

/**
 * Creates an image from the current state of the Mapbox map.
 *
 * @function
 * @param {Map} map - The Mapbox map instance.
 * @returns {Promise<Blob | null>} - A promise that resolves to a Blob representing the map image, or null if the image creation fails.
 */
const createMapImage = <T extends boolean>(
  map: Map,
  width: number,
  height: number,
  toBlob: T
): Promise<T extends true ? Blob | null : string> => {
  return new Promise((resolve) => {
    map.once('render', () => {
      const canvas = map.getCanvas();

      // Defined in ScreenshotUtility.tsx
      const mapboxLogo = document.getElementById('mapbox-logo') as HTMLImageElement | null;
      const asuLogo = document.getElementById('asu-logo') as HTMLImageElement | null;
      const cgsLogo = document.getElementById('cgs-logo') as HTMLImageElement | null;

      const newCanvas = document.createElement('canvas');
      newCanvas.width = width;
      newCanvas.height = height;
      const context = newCanvas.getContext('2d');
      if (context) {
        context.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
        context.globalAlpha = 0.7; // 70% opacity
        // positioned at start + 20 pixels, canvas height - 45 units
        // width 133px, height 30px
        if (mapboxLogo) {
          context.drawImage(mapboxLogo, 0 + 20, height - 45, 133, 30);
        }

        if (asuLogo) {
          context.drawImage(asuLogo, width - 290, height - 55, 88.9, 50);
        }
        context.globalAlpha = 0.85; // 85% opacity
        if (cgsLogo) {
          context.drawImage(cgsLogo, width - 200, height - 50, 181.2, 40);
        }
        context.globalAlpha = 1; // reset

        context.globalAlpha = 0.8;
        context.fillStyle = '#000';
        context.shadowColor = 'rgba(255,255,255,0.9)';
        context.shadowBlur = 4;
        context.font = '12px sans-serif';
        context.textAlign = 'right';
        context.textBaseline = 'top';
        context.fillText('© Mapbox, © OpenStreetMap', width - 10, 10);
        context.globalAlpha = 1;

        if (toBlob) {
          newCanvas.toBlob((blob) => {
            resolve(blob as T extends true ? Blob | null : string);
          });
        } else {
          resolve(newCanvas.toDataURL() as T extends true ? Blob | null : string);
        }
      } else {
        resolve(null as T extends true ? Blob | null : string);
      }
    });
    map.setBearing(map.getBearing()); // trigger render
  });
};

/**
 * Duplicates a Mapbox map instance with a specified center and aspect ratio.
 *
 * @function
 * @param {Map} originalMap - The original Mapbox map instance.
 * @param {LngLatLike} center - The center coordinates for the new map.
 * @param {string} accessToken - The Mapbox access token.
 * @param {[number, number]} aspectRatio - The aspect ratio for the new map container.
 * @returns {Map} - The new Mapbox map instance.
 */
const duplicateMapInstance = (
  originalMap: Map,
  center: LngLatLike,
  accessToken: string,
  aspectRatio: [number, number]
): { map: Map; container: HTMLDivElement } => {
  const container = document.createElement('div');
  container.style.width = `${aspectRatio[0]}px`;
  container.style.height = `${aspectRatio[1]}px`;
  document.body.appendChild(container);
  const newMap = new Map({
    accessToken,
    container,
    center,
    style: originalMap.getStyle(),
    zoom: originalMap.getZoom(),
    bearing: originalMap.getBearing(),
    pitch: originalMap.getPitch(),
  });
  return { map: newMap, container };
};

/**
 * After the new map loads, create the map image and update the state of the calling component.
 *
 * @function
 * @param {Map} map - The Mapbox map instance.
 * @param {boolean} cancel - A flag indicating the calling component has unmounted.
 * @param {Dispatch<SetStateAction<Blob | null>>} setMapImage - A state setter function for the map image.
 */
const handleMapLoad = <T extends boolean>(
  map: Map,
  container: HTMLDivElement | null = null,
  width: number,
  height: number,
  toBlob: T,
  updateMapImage: (src: T extends true ? Blob | null : string) => void,
  updateLoading: (loading: boolean) => void,
  destroy: boolean = false
): void => {
  void createMapImage(map, width, height, toBlob).then((data) => {
    updateMapImage(data as T extends true ? Blob | null : string);

    if (destroy) {
      map.remove(); // removes WebGL + listeners

      if (container) {
        container.remove(); // removes DOM node → prevents memory leak
      }
    }

    updateLoading(false);
  });
};

/**
 * Creates an image from an existing Mapbox map instance.
 *
 * @function
 * @param {Map} map - The original Mapbox map instance.
 * @param {LngLatLike} center - The center coordinates for the new map.
 * @param {string} accessToken - The Mapbox access token.
 * @param {boolean} cancel - A flag indicating the calling component has unmounted.
 * @param {Dispatch<SetStateAction<T | null>>} setMapImage - A state setter function for the map image.
 */
export const handleCreateMapImage = <T extends boolean>(
  map: Map,
  width: number,
  height: number,
  toBlob: T,
  updateMapImage: (src: T extends true ? Blob | null : string) => void,
  updateLoading: (loading: boolean) => void
): void => {
  handleMapLoad(map, null, width, height, toBlob, updateMapImage, updateLoading);
};

/**
 * Clones the provided map instance and generates an image from it.
 *
 * @function
 * @param {Map} map - The original Mapbox map instance.
 * @param {LngLatLike} center - The center coordinates for the new map.
 * @param {string} accessToken - The Mapbox access token.
 * @param {boolean} cancel - A flag indicating the calling component has unmounted.
 * @param {Dispatch<SetStateAction<T | null>>} setMapImage - A state setter function for the map image.
 */
export const handleCloneCreateMapImage = <T extends boolean>(
  map: Map,
  center: LngLatLike,
  accessToken: string,
  width: number,
  height: number,
  toBlob: T,
  updateMapImage: (src: T extends true ? Blob | null : string) => void,
  updateLoading: (loading: boolean) => void
): void => {
  const { map: newMap, container } = duplicateMapInstance(map, center, accessToken, [
    width,
    height,
  ]);
  loadImages(newMap);
  newMap.once('load', () => {
    handleMapLoad(newMap, container, width, height, toBlob, updateMapImage, updateLoading);
  });
};
