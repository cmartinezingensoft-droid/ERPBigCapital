import { useResourceData } from '../GenericResource';
import { getUniversalSearchBind } from '@/containers/UniversalSearch/utils';

/**
 * Transformes the resource data to search entries based on
 * the given resource type.
 * @param {string} type
 * @param {any} resource
 * @returns
 */
function transfromResourceDataToSearch(resource: any) {
  if (!resource?._type || !Array.isArray(resource?.items)) {
    return [];
  }

  const selectItem = getUniversalSearchBind(resource._type, 'itemSelect');

  return resource.items.map((item: unknown) => ({
    ...(selectItem ? selectItem(item) : {}),
    _type: resource._type,
  }));
}

/**
 *
 * @param {*} type
 * @param {*} searchKeyword
 * @returns
 */
export function useUniversalSearch(
  type: string,
  searchKeyword: string,
  props?: unknown,
) {
  const { data, ...restProps } = useResourceData(
    type,
    {
      search_keyword: searchKeyword,
    },
    props,
  );
  const searchData = transfromResourceDataToSearch(data);

  return {
    data: searchData,
    ...restProps,
  };
}
