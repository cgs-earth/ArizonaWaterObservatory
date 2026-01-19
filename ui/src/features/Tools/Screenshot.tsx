/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import debounce from 'lodash.debounce';
import { Map } from 'mapbox-gl';
import { Box, Image, Loader, Stack, Title, Tooltip } from '@mantine/core';
import Camera from '@/assets/Camera';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import NumberInput from '@/components/NumberInput';
import Popover from '@/components/Popover';
import TextInput from '@/components/TextInput';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import styles from '@/features/Tools/Tools.module.css';
import notificationManager from '@/managers/Notification.init';
import useSessionStore from '@/stores/session';
import { NotificationType, Overlay } from '@/stores/session/types';
import { handleCreateMapImage } from '@/utils/screenshot';
import { MAP_ID } from '../Map/config';
import { loadImages } from '../Map/utils';

export const Screenshot: React.FC = () => {
  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  const [src, setSrc] = useState<string>('');
  const [name, setName] = useState<string>(
    `AWO_${new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}`
  );
  const [loading, setLoading] = useState<boolean>(false);

  const [show, setShow] = useState(false);
  const [width, setWidth] = useState(1600);
  const [height, setHeight] = useState(900);

  const { map } = useMap(MAP_ID);

  const cloneMap = useRef<Map>(null);
  const container = useRef<HTMLDivElement>(null);

  const isMovingRef = useRef(false);
  const isMounted = useRef(true);
  const updateSource = (src: string) => {
    if (isMounted.current) {
      setSrc(src);
    }
  };

  const updateLoading = (loading: boolean) => {
    if (isMounted.current) {
      setLoading(loading);
    }
  };

  const handleScreenshot = async (
    originalMap: Map,
    cloneMap: Map,
    container: HTMLDivElement,
    width: number,
    height: number
  ) => {
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;

    cloneMap.resize();
    cloneMap.setStyle(originalMap.getStyle());
    cloneMap.setCenter(originalMap.getCenter());
    cloneMap.setZoom(originalMap.getZoom());
    cloneMap.setBearing(originalMap.getBearing());
    cloneMap.setPitch(originalMap.getPitch());

    handleCreateMapImage(cloneMap, width, height, false, updateSource, updateLoading);
  };

  useEffect(() => {
    return () => {
      if (cloneMap.current) {
        cloneMap.current.remove();
      }

      if (container.current) {
        container.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }

    const { width, height } = map.getCanvas();

    setWidth(width);
    setHeight(height);

    container.current = document.createElement('div');
    container.current.style.width = `${width}px`;
    container.current.style.height = `${height}px`;
    document.body.appendChild(container.current);
    cloneMap.current = new Map({
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      container: container.current,
      center: map.getCenter(),
      style: map.getStyle(),
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    });

    loadImages(cloneMap.current);
    cloneMap.current.once('load', () => {
      void handleScreenshot(map, cloneMap.current!, container.current!, width, height);
    });
  }, [map]);

  const debouncedScreenshot = useMemo(
    () =>
      debounce(() => {
        if (!map || !cloneMap.current || !container.current) {
          return;
        }

        handleScreenshot(map!, cloneMap.current, container.current, width, height);
      }, 150),
    [map, cloneMap.current, container.current, width, height]
  );

  useEffect(() => {
    if (!map || isMovingRef.current || !cloneMap.current || !container.current) {
      return;
    }

    if (show) {
      void handleScreenshot(map, cloneMap.current, container.current, width, height);
    }

    const onMove = () => {
      isMovingRef.current = true;
      if (isMounted.current) {
        setLoading(true);
      }
      map.once('idle', () => {
        isMovingRef.current = false;
        debouncedScreenshot();
      });
    };

    map.off('dragend', onMove);
    map.off('zoomend', onMove);

    if (!show) {
      return;
    }

    map.on('dragend', onMove);
    map.on('zoomend', onMove);

    return () => {
      map.off('dragend', onMove);
      map.off('zoomend', onMove);
    };
  }, [width, height, show]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadImage = async () => {
    try {
      downloadDataUrl(src, `${name}.jpg`);

      const legend = document.getElementById('legend');
      if (!legend) {
        return;
      }

      // ensure it's rendered
      await new Promise(requestAnimationFrame);

      const dataUrl = await toJpeg(legend, {
        style: { display: 'block' },
      });
      downloadDataUrl(dataUrl, `${name}-legend.jpg`);
    } catch (err) {
      notificationManager.show((err as Error).message, NotificationType.Error, 10000);
    }
  };

  const handleShow = (show: boolean) => {
    setOverlay(show ? Overlay.Draw : null);
    setShow(show);
  };

  const handleWidthChange = (width: number) => {
    setWidth(width);
  };
  const handleHeightChange = (height: number) => {
    setHeight(height);
  };

  const debouncedHandleWidthChange = debounce(handleWidthChange, 500);
  const debouncedHandleHeightChange = debounce(handleHeightChange, 500);

  useEffect(() => {
    if (overlay !== Overlay.Draw) {
      setShow(false);
    }
  }, [overlay]);

  return (
    <Popover
      offset={16}
      opened={show}
      onChange={setShow}
      closeOnClickOutside={false}
      unmountOnExit
      target={
        <Tooltip label="Change map styling." disabled={show}>
          <IconButton
            variant={show ? Variant.Selected : Variant.Secondary}
            onClick={() => handleShow(!show)}
          >
            <Camera />
          </IconButton>
        </Tooltip>
      }
      content={
        <Stack gap={8} align="flex-start" className={styles.screenshotWrapper}>
          <Title order={5} size="h3">
            Screenshot
          </Title>
          {src && src.length > 0 ? (
            <>
              {loading ? (
                <Box className={styles.screenshotLoaderContainer}>
                  <Loader color="#0183a1" type="dots" />
                </Box>
              ) : (
                <Image
                  src={src}
                  alt="Preview of Map Screenshot"
                  width={50}
                  height={100}
                  fit="contain"
                />
              )}

              <TextInput
                size="sm"
                label="File Name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
              <NumberInput
                size="xs"
                label="Width"
                min={464}
                max={3000}
                value={width}
                onChange={(value) => debouncedHandleWidthChange(Number(value))}
              />
              <NumberInput
                size="xs"
                label="Height"
                value={height}
                min={82}
                max={2000}
                onChange={(value) => debouncedHandleHeightChange(Number(value))}
              />
              <Button variant={Variant.Primary} onClick={downloadImage} disabled={loading}>
                Download
              </Button>
            </>
          ) : (
            <Loader color="#0183a1" type="dots" />
          )}
        </Stack>
      }
    />
  );
};
