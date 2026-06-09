/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { LngLatLike, Map, Popup } from 'mapbox-gl';
import { LAYER_IDENTIFIER, LOCATION_IDENTIFIER } from '@/features/Map/consts';
import { Layer, Location } from '@/stores/main/types';

export class PopupService {
  private map: Map | null = null;
  private hoverPopup: Popup | null = null;
  private persistentPopup: Popup | null = null;
  private container: HTMLDivElement | null = null;

  /**
   * Setter function to set map private variable after map initialization
   *
   * @function
   */
  public setMap(map: Map): void {
    if (!this.map) {
      this.map = map;
    }
  }

  /**
   * Setter function to set hoverPopup private variable after map initialization
   *
   * @function
   */
  public setHoverPopup(popup: Popup): void {
    if (!this.hoverPopup) {
      this.hoverPopup = popup;
    }
  }
  /**
   * Setter function to set container private variable after map initialization
   *
   * @function
   */
  public setPersistentPopup(popup: Popup): void {
    if (!this.persistentPopup) {
      this.persistentPopup = popup;
    }
  }

  /**
   * Setter function to set container private variable after map initialization
   *
   * @function
   */
  public setContainer(container: HTMLDivElement): void {
    if (!this.container) {
      this.container = container;
    }
  }

  public clearStalePopup(evaluate: (layerId: Layer['id'], locationId: Location['id']) => boolean) {
    if (this.container && this.persistentPopup) {
      const locationId = this.container.getAttribute(LOCATION_IDENTIFIER);
      const layerId = this.container.getAttribute(LAYER_IDENTIFIER);
      if (locationId && layerId && evaluate(layerId, locationId)) {
        this.persistentPopup.remove();
      }
    }
  }

  public removeHoverPopup() {
    if (this.hoverPopup) {
      this.hoverPopup.remove();
    }
  }

  public showHoverPopup(lngLat: LngLatLike, html: string) {
    if (this.map && this.hoverPopup) {
      this.hoverPopup!.setLngLat(lngLat).setHTML(html).addTo(this.map);
    }
  }
}
