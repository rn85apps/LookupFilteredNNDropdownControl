import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { Icon } from '@fluentui/react/lib/Icon';
import * as React from 'react';
import { IInputs } from '../generated/ManifestTypes';
import useInputs from '../hooks/useInputs';

export interface ILookupFilteredNNDropdownComponentProps {
  context: ComponentFramework.Context<IInputs>;
}

const iconStyles = { marginRight: '8px' };

const onRenderOption = (option?: IDropdownOption): JSX.Element => {
  if (option) {
    return (
      <div>
        {option.data && option.data.icon && (
          <Icon
            style={iconStyles}
            iconName={option.data.icon}
            aria-hidden="true"
            title={option.data.icon}
          />
        )}
        <span>{option.text}</span>
      </div>
    );
  }
  return <></>;
};

export const LookupFilteredNNDropdownComponent = React.memo(
  (context: ComponentFramework.Context<IInputs>): JSX.Element => {
    const {
      recordEntityReference,
      filteringLookupReference,
      options,
      selected,
      setSelected,
      relate,
      unrelate
    } = useInputs(context.parameters, context.webAPI);

    const handleChange = React.useCallback(
      async (_event: React.FormEvent<HTMLDivElement>, item?: IDropdownOption) => {
        if (!item || context.mode.isControlDisabled) return;

        const targetName = context.parameters.targetName.raw;
        const relationshipName = context.parameters.relationshipName.raw;

        if (!targetName || !relationshipName || !recordEntityReference) return;

        if (selected) {
          // if the array exists, then add or remove the item as necessary
          setSelected(
            item.selected
              ? [...selected, item.key as string]
              : selected.filter(key => key !== item.key)
          );
        } else {
          if (item.selected) {
            // add the first entry if there the array is null
            setSelected([item.key as string]);
          }
        }

        const itemReference: ComponentFramework.LookupValue = {
          entityType: targetName,
          id: item.key.toString(),
        };

        if (!item.selected) {
          await unrelate(itemReference.id);
        } else {
          await relate([itemReference]);
        }
      },
      [
        context.webAPI,
        relate,
        context.mode.isControlDisabled,
        selected,
        setSelected,
        recordEntityReference,
        context.parameters.targetName.raw,
        context.parameters.relationshipName.raw,
      ]
    );

    if (!recordEntityReference) {
      return <>Control will render once the record is saved</>;
    }

    if (!filteringLookupReference) {
      return (
        <>
          Control will render once a record has been set in the{' '}
          {context.parameters.filteringLookup.attributes?.DisplayName} field
        </>
      );
    }

    return (
      <Dropdown
        selectedKeys={selected}
        onChange={handleChange}
        placeholder={options && options.length > 0 ? '---' : 'No options available'}
        disabled={context.mode.isControlDisabled}
        multiSelect
        options={options ? options : []}
        onRenderOption={onRenderOption}
      />
    );
  },
  (prev, next) => {
    return prev === next;
  }
);
