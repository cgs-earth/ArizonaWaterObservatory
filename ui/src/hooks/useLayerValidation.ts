/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useEffect, useState } from 'react';
import { ComboboxData } from '@mantine/core';
import { CollectionRestrictions, RestrictionType } from '@/consts/collections';
import { useLoading } from '@/hooks/useLoading';
import mainManager from '@/managers/Main.init';
import { Layer } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';
import { isSamePalette, isValidPalette } from '@/utils/colors';
import { isSameArray } from '@/utils/compareArrays';
import { getTemporalExtent } from '@/utils/temporalExtent';

dayjs.extend(isSameOrBefore);

type Data = {
  name?: Layer['name'];
  parameters?: Layer['parameters'];
  color?: Layer['color'];
  from?: Layer['from'];
  to?: Layer['to'];
  opacity?: Layer['opacity'];
  paletteDefinition?: Layer['paletteDefinition'];
  collectionType?: CollectionType;
  parameterOptions?: ComboboxData;
};

export const useLayerValidation = (layer: Layer, isLoading: boolean, data: Data) => {
  const {
    parameters = [],
    from = null,
    to = null,
    paletteDefinition = null,
    collectionType = CollectionType.Unknown,
    parameterOptions = [],
  } = data;

  const [parameterLimit, setParameterLimit] = useState<number>();
  const [daysLimit, setDaysLimit] = useState<number>();

  const [minDate, setMinDate] = useState<string>();
  const [maxDate, setMaxDate] = useState<string>();

  const { isFetchingCollections, isLoadingGeography } = useLoading();

  useEffect(() => {
    const restrictions = CollectionRestrictions[layer.datasourceId];

    if (restrictions && restrictions.length > 0) {
      const parameterLimitRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Parameter
      );

      if (parameterLimitRestriction && parameterLimitRestriction.count > 0) {
        setParameterLimit(parameterLimitRestriction.count);
      }

      const daysLimitRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Day
      );

      if (daysLimitRestriction && daysLimitRestriction.days > 0) {
        setDaysLimit(daysLimitRestriction.days);
      }
    }
  }, [layer]);

  useEffect(() => {
    if (isFetchingCollections || data) {
      return;
    }

    const collection = mainManager.getDatasource(layer.datasourceId);

    if (collection) {
      const temporalExtent = getTemporalExtent(collection);

      if (temporalExtent) {
        const { min, max } = temporalExtent;

        if (min) {
          setMinDate(min);
        }
        if (max) {
          setMaxDate(max);
        }
      }
    }
  }, [isFetchingCollections]);

  const getIsDateRangeOverLimit = () => {
    if (daysLimit) {
      if (!from || !to || !dayjs(from).isValid() || !dayjs(to).isValid()) {
        return true;
      }

      return dayjs(to).diff(dayjs(from), 'days') > daysLimit;
    }
    return false;
  };

  const showSearchTool = [CollectionType.EDR, CollectionType.Features].includes(collectionType);
  const showLabelTool = [CollectionType.EDR, CollectionType.Features].includes(collectionType);

  /**
   * This layer is a grid type which requires at least one selected parameter
   *
   * @constant
   */
  const isMissingParameters = collectionType === CollectionType.EDRGrid && parameters.length === 0;
  /**
   * There is a parameter count limit on for this dataset and we have exceeded it
   *
   * @constant
   */
  const isParameterSelectionOverLimit = parameterLimit ? parameters.length > parameterLimit : false;
  /**
   * There is a limit to the number of days allowed within this range on for this dataset and we have exceeded it
   *
   * @constant
   */
  const isDateRangeOverLimit = getIsDateRangeOverLimit();
  /**
   * Is the to date before the from date if both exist
   *
   * @constant
   */
  const isValidRange = from && to ? dayjs(from).isSameOrBefore(dayjs(to)) : true;

  /**
   * This dataset supports time series for parameters
   *
   * @constant
   */
  const hasScientificMeasurements = [CollectionType.EDR, CollectionType.EDRGrid].includes(
    collectionType
  );
  /**
   * This is a features dataset, show additional message
   *
   * @constant
   */
  const showFeaturesMessage = collectionType === CollectionType.Features;
  /**
   * Show additional warning about date ranges for EDRGrid
   *
   * @constant
   */
  const showDateRangeWarning = collectionType === CollectionType.EDRGrid;
  /**
   * This is a raster or grid layer which can meaningfully implement opacity
   *
   * @constant
   */
  const showOpacitySlider = [CollectionType.Map, CollectionType.EDRGrid].includes(collectionType);
  /**
   * A raster layer can't be colorized
   *
   * @constant
   */
  const showColorInput = collectionType !== CollectionType.Map;

  const isPaletteDefinitionValid = isValidPalette(paletteDefinition);

  const showPalette = collectionType === CollectionType.EDRGrid && parameterOptions;

  const doesPaletteHaveParameter =
    !paletteDefinition || parameters.includes(paletteDefinition?.parameter);

  /**
   * The user has modified this layer since the last save
   *
   * @constant
   */
  const hasUnsavedChanges =
    !isSameArray(parameters, layer.parameters) ||
    (collectionType === CollectionType.EDRGrid && from !== layer.from) ||
    to !== layer.to ||
    !isSamePalette(paletteDefinition, layer.paletteDefinition);

  /**
   * This layer has validation issues or there are blocking actions
   *
   * @constant
   */
  const isSaveDisabled =
    isLoadingGeography ||
    !hasUnsavedChanges ||
    isLoading ||
    (collectionType === CollectionType.EDRGrid && (!isValidRange || isDateRangeOverLimit)) ||
    isMissingParameters ||
    isParameterSelectionOverLimit;

  const getDateInputError = () => {
    // is to >= from?
    if (isValidRange) {
      // is there a limit on days and have we exceeded it?
      if (daysLimit && isDateRangeOverLimit) {
        return `${dayjs(to).diff(dayjs(from), 'days') - daysLimit} day(s) over limit`;
      }
      return false;
    }

    return 'Invalid date range';
  };

  const getParameterError = () => {
    if (parameterLimit && isParameterSelectionOverLimit) {
      return `Please remove ${parameters.length - parameterLimit} parameter${parameters.length - parameterLimit > 1 ? 's' : ''}`;
    }

    return false;
  };

  const getSaveTooltip = () => {
    if (isLoadingGeography) {
      return 'Please wait for spatial filter to finish loading data.';
    }

    if (isLoading) {
      return 'Please wait for layer update to finish.';
    }
    if (!isValidRange || isDateRangeOverLimit) {
      return 'Please correct date range.';
    }
    if (isMissingParameters) {
      return 'Grid layers require at least one parameter.';
    }
    if (isParameterSelectionOverLimit) {
      return 'Please remove parameters.';
    }
    if (!isPaletteDefinitionValid) {
      return 'Please correct dynamic color settings.';
    }
    if (!doesPaletteHaveParameter) {
      return 'Dynamic color settings has invalid parameter.';
    }

    if (hasUnsavedChanges) {
      return 'Save changes to layer.';
    }

    return 'Layer has not been modified.';
  };

  const getCancelTooltip = () => {
    if (isLoadingGeography) {
      return 'Please wait for spatial filter to finish loading data.';
    }

    if (isLoading) {
      return 'Please wait for layer update to finish.';
    }
    if (!hasUnsavedChanges) {
      return 'Layer has not been modified.';
    }
    return null;
  };

  return {
    minDate,
    maxDate,
    isMissingParameters,
    isParameterSelectionOverLimit,
    isDateRangeOverLimit,
    isValidRange,
    hasScientificMeasurements,
    showFeaturesMessage,
    showDateRangeWarning,
    showOpacitySlider,
    showColorInput,
    isPaletteDefinitionValid,
    doesPaletteHaveParameter,
    hasUnsavedChanges,
    isSaveDisabled,
    showPalette,
    showSearchTool,
    showLabelTool,
    getIsDateRangeOverLimit,
    getDateInputError,
    getParameterError,
    getSaveTooltip,
    getCancelTooltip,
  };
};
