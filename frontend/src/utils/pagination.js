export function listItems(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return response?.items || [];
}

export function pageMeta(response) {
  return (
    response?.meta ||
    response?.data?.meta ||
    (response?.data?.last_page ? response.data : response) ||
    {}
  );
}

export async function collectPages(load, params = {}) {
  const items = [];
  let page = 1;
  let lastPage = 1;
  do {
    const response = await load({ ...params, page, per_page: 100 });
    items.push(...listItems(response));
    lastPage = Number(pageMeta(response).last_page || 1);
    page += 1;
  } while (page <= lastPage);
  return items;
}
