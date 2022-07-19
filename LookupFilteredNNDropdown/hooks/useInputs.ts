import { useState, useEffect, useCallback } from 'react';
import { IDropdownOption, DropdownMenuItemType } from '@fluentui/react/lib/Dropdown';
import { IInputs } from '../generated/ManifestTypes';
import { AssociateRequest } from '../classes/AssociateRequest';
import { DisassociateRequest } from '../classes/DisassociateRequest';

export default function useInputs(parameters: IInputs, webApi: ComponentFramework.WebApi) {
  const [recordEntityReference, setRecordEntityReference] =
    useState<ComponentFramework.LookupValue | null>(null);

  const [filteringLookupReference, setFilteringLookupReference] =
    useState<ComponentFramework.LookupValue | null>(null);

  const [optionsQuery, setOptionsQuery] = useState<string | null>(null);

  const [optionsEntities, setOptionsEntities] = useState<ComponentFramework.WebApi.Entity[] | null>(
    null
  );

  const [options, setOptions] = useState<IDropdownOption[] | null>(null);

  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  const [selectedEntities, setSelectedEntities] = useState<
    ComponentFramework.WebApi.Entity[] | null
  >(null);

  const [selected, setSelected] = useState<string[] | null>(null);

  const relate = useCallback(
    async (targetEntityReferences: ComponentFramework.LookupValue[]) => {
      const relationshipName = parameters.relationshipName.raw;

      if (relationshipName && recordEntityReference && targetEntityReferences) {
        const request = new AssociateRequest(
          recordEntityReference,
          targetEntityReferences,
          relationshipName
        );

        const response = await (webApi as any).execute(request);

        return response?.ok
          ? {
              ok: response.ok as boolean,
              status: response.status as number,
              statusText: response.statusText as string,
            }
          : null;
      }
    },
    [(webApi as any).exeute, parameters.relationshipName.raw, recordEntityReference]
  );

  const unrelate = useCallback(
    async (targetRecordId: string) => {
      const relationshipName = parameters.relationshipName.raw;

      if (relationshipName && recordEntityReference && targetRecordId) {
        const request = new DisassociateRequest(
          recordEntityReference,
          targetRecordId,
          relationshipName
        );
        const response = await (webApi as any).execute(request);
        return response?.ok
          ? {
              ok: response.ok as boolean,
              status: response.status as number,
              statusText: response.statusText as string,
            }
          : null;
      }
    },
    [(webApi as any).execute, recordEntityReference, parameters.relationshipName.raw]
  );

  // updates the entity reference to the form record when needed
  useEffect(() => {
    const id = parameters.recordId.raw;
    const entityType = parameters.recordTypeName.raw;

    if (id && entityType) {
      setRecordEntityReference({
        id,
        entityType,
      });
    } else {
      setRecordEntityReference(null);
    }
  }, [parameters.recordId.raw, parameters.recordTypeName.raw]);

  // updates the lookup entity reference when needed
  useEffect(() => {
    const lookup = parameters.filteringLookup.raw;
    if (lookup && lookup.length > 0) {
      setFilteringLookupReference({
        id: lookup[0].id,
        entityType: lookup[0].entityType,
        name: lookup[0].name,
      });
    } else {
      setFilteringLookupReference(null);
    }
  }, [parameters.filteringLookup.raw]);

  // updates the options query when needed
  useEffect(() => {
    const targetNameAttribute = parameters.targetNameAttribute.raw;
    const targetGroupingAttribute = parameters.targetGroupingAttribute.raw;
    const targetLookupAttribute = parameters.targetLookupAttribute.raw;

    if (
      targetNameAttribute &&
      targetGroupingAttribute &&
      targetLookupAttribute &&
      filteringLookupReference
    ) {
      const query = `?$select=${targetNameAttribute},${targetGroupingAttribute}&$filter=(_${targetLookupAttribute}_value eq ${filteringLookupReference.id})`;
      setOptionsQuery(query);
    } else {
      setOptionsQuery(null);
    }
  }, [
    parameters.targetNameAttribute.raw,
    parameters.targetGroupingAttribute.raw,
    parameters.targetLookupAttribute.raw,
    filteringLookupReference,
  ]);

  // updates the options entities, when needed
  useEffect(() => {
    let canceled = false;

    const fetchData = async () => {
      let data: ComponentFramework.WebApi.Entity[] | null = null;
      const targetName = parameters.targetName.raw;

      if (targetName && optionsQuery) {
        const response = await webApi.retrieveMultipleRecords(targetName, optionsQuery);

        if (response && response.entities && response.entities.length > 0) {
          data = response.entities;
        }
      }

      if (!canceled) {
        setOptionsEntities(data);
      }
    };

    fetchData().catch(console.error);

    return () => {
      canceled = true;
    };
  }, [webApi.retrieveMultipleRecords, parameters.targetName.raw, optionsQuery]);

  // updates the options array, when needed
  useEffect(() => {
    let allOptions: IDropdownOption[] | null = null;

    const targetIdAttribute = parameters.targetIdAttribute.raw;
    const targetNameAttribute = parameters.targetNameAttribute.raw;
    const targetGroupingAttribute = parameters.targetGroupingAttribute.raw;
    const dropdownIcon = parameters.dropdownIcon.raw;

    if (
      targetIdAttribute &&
      targetNameAttribute &&
      targetGroupingAttribute &&
      dropdownIcon &&
      optionsEntities
    ) {
      let groupedSortedOptions: IDropdownOption[] = [];

      const data = optionsEntities
        .map(entity => {
          const item = {
            key: entity[targetIdAttribute],
            text: entity[targetNameAttribute],
            group: entity[
              `${targetGroupingAttribute}@OData.Community.Display.V1.FormattedValue`
            ] as string,
          };

          return item;
        })
        .sort((a, b) => (a.text > b.text ? 1 : b.text > a.text ? -1 : 0));

      const groups = groupBy(data, 'group');

      // populate the items for each group
      groups.forEach((items, itemKey) => {
        // add a header
        groupedSortedOptions = [
          ...groupedSortedOptions,
          {
            key: itemKey + 'header',
            text: itemKey,
            itemType: DropdownMenuItemType.Header,
          } as IDropdownOption,
        ];

        // add each item
        items.map(item => {
          groupedSortedOptions = [
            ...groupedSortedOptions,
            {
              key: item.key,
              text: item.text,
              data: { icon: dropdownIcon },
            } as IDropdownOption,
          ];
        });

        // add a divider
        groupedSortedOptions = [
          ...groupedSortedOptions,
          {
            key: itemKey + 'divider',
            text: '-',
            itemType: DropdownMenuItemType.Divider,
          } as IDropdownOption,
        ];
      });

      allOptions = groupedSortedOptions;
    }

    setOptions(allOptions);
  }, [
    optionsEntities,
    parameters.targetIdAttribute.raw,
    parameters.targetNameAttribute.raw,
    parameters.targetGroupingAttribute.raw,
    parameters.dropdownIcon.raw,
    groupBy,
  ]);

  // updates the selected query when needed
  useEffect(() => {
    const targetName = parameters.targetName.raw;
    const targetIdAttribute = parameters.targetIdAttribute.raw;
    const targetNameAttribute = parameters.targetNameAttribute.raw;
    const targetLookupAttribute = parameters.targetLookupAttribute.raw;
    const relationshipTableName = parameters.relationshipTableName.raw;
    const recordIdAttribute = parameters.recordIdAttribute.raw;

    if (
      targetName &&
      targetIdAttribute &&
      targetNameAttribute &&
      targetLookupAttribute &&
      relationshipTableName &&
      recordIdAttribute &&
      recordEntityReference
    ) {
      // retrieve all target records that are currently related to the form record
      const fetchXml = `
        <fetch mapping='logical'>
            <entity name='${targetName}'>
                <attribute name='${targetIdAttribute}' />
                <attribute name='${targetNameAttribute}' />
                <attribute name='${targetLookupAttribute}' />
                <link-entity name='${relationshipTableName}' from='${targetIdAttribute}' to='${targetIdAttribute}' intersect='true'>
                    <filter type='and'>
                        <condition attribute='${recordIdAttribute}' operator='eq' value='${recordEntityReference.id}'/>
                    </filter>
                </link-entity>
            </entity>
        </fetch>`.trim();

      setSelectedQuery('?fetchXml=' + fetchXml);
    } else {
      setSelectedQuery(null);
    }
  }, [
    parameters.targetName.raw,
    parameters.targetIdAttribute.raw,
    parameters.targetNameAttribute.raw,
    parameters.targetLookupAttribute.raw,
    parameters.relationshipTableName.raw,
    parameters.recordIdAttribute.raw,
    recordEntityReference,
    filteringLookupReference,
  ]);

  // updates the selected entities array, when needed
  useEffect(() => {
    let canceled = false;

    const fetchData = async () => {
      let data: ComponentFramework.WebApi.Entity[] | null = null;
      const targetName = parameters.targetName.raw;
      const targetLookupAttribute = parameters.targetLookupAttribute.raw;
      const targetIdAttribute = parameters.targetIdAttribute.raw;

      if (
        targetName &&
        targetLookupAttribute &&
        targetIdAttribute &&
        selectedQuery &&
        filteringLookupReference
      ) {
        const response = await webApi.retrieveMultipleRecords(targetName, selectedQuery);
        let relatedFilteredEntities: ComponentFramework.WebApi.Entity[] = [];

        if (response?.entities?.length > 0) {
          // clear entities that are currently related to the form record but not the filtering lookup
          await Promise.all(
            response.entities.map(async (entity: ComponentFramework.WebApi.Entity) => {
              const targetLookupValue = entity[`_${targetLookupAttribute}_value`];

              if (targetLookupValue !== filteringLookupReference.id) {
                await unrelate(entity[targetIdAttribute]);
              } else {
                relatedFilteredEntities = [...relatedFilteredEntities, entity];
              }
            })
          );

          if (relatedFilteredEntities.length > 0) {
            data = relatedFilteredEntities;
          }
        }
      }

      if (!canceled) {
        setSelectedEntities(data);
      }
    };

    fetchData().catch(console.error);

    return () => {
      canceled = true;
    };
  }, [
    webApi.retrieveMultipleRecords,
    selectedQuery,
    parameters.targetName.raw,
    parameters.targetLookupAttribute.raw,
    parameters.targetIdAttribute.raw,
    filteringLookupReference,
  ]);

  // updates the selected ids array, when needed
  useEffect(() => {
    const targetIdAttribute = parameters.targetIdAttribute.raw;

    if (
      selectedEntities &&
      selectedEntities.length > 0 &&
      targetIdAttribute &&
      filteringLookupReference
    ) {
      const selectedFilteredIds = selectedEntities.map(item => item[targetIdAttribute]);
      setSelected(selectedFilteredIds);
    } else {
      setSelected(null);
    }
  }, [selectedEntities, parameters.targetIdAttribute.raw, filteringLookupReference, unrelate]);

  return {
    recordEntityReference: recordEntityReference,
    filteringLookupReference: filteringLookupReference,
    options: options,
    selected: selected,
    setSelected: setSelected,
    relate: relate,
    unrelate: unrelate,
  };
}

function groupBy<T, K extends keyof T>(array: T[], key: K): Map<T[K], T[]> {
  const map = new Map<T[K], T[]>();
  array.forEach(item => {
    const itemKey = item[key];
    if (!map.has(itemKey)) {
      map.set(
        itemKey,
        array.filter(i => i[key] === item[key])
      );
    }
  });
  return map;
}
