import axios from 'axios';
import { map, toPairs, pipe, join, isEmpty, reject } from 'ramda';
import { stringify } from 'query-string';

const ORDER_ENUM = Object.freeze({
  DESC: 'DESC',
  ASC: 'ASC'
});

const ORDER_TOKEN = Object.freeze({
  [ORDER_ENUM.DESC]: '-',
  [ORDER_ENUM.ASC]: ''
});

const operations = Object.freeze({
  eq: (a, b) => `(${a},eq,${b})`,
  like: (a, b, config = { left: true, right: true }) => `(${a},like,${config.left && '~'}${b}${config.right && '~'})`
});

/**
 * Maps react-admin queries to XMYSQL REST API
 * @see https://github.com/o1lab/xmysql
 *
 * @param {string} apiUrl: API base URL
 * @param {object} decorators: decorators/undecorators (ex. composite primary keys should be separated by three underscores)
 *
 * @example Decorator example:
 * {
 *   'posts': (post) => ({...post, id: post.first_key + '___' + post.second_key}) // on getList, getManyReference (property name without -)
 *   '-posts': (post) => { ... do stuff on CUD ... }  // on create, update, updateMany, delete (property name with -)
 * }
 */
export default (apiUrl, decorators = {}) => {
  return {
    getList: async (resource, { pagination, sort, filter }) => {
      const { data: countResponse } = await axios(`${apiUrl}/api/${resource}/count`);
      const rows = countResponse[0].no_of_rows;

      if (rows < 1) return { data: [], total: 0 };

      const { page, perPage } = pagination;
      const { field, order } = sort;

      const queryString = stringify(
        reject(isEmpty, {
          _p: page - 1,
          _size: perPage,
          _sort: `${ORDER_TOKEN[order]}${field}`,
          /**
           * NOTE: this part behaves badly with ReferenceInput and ReferecenArrayInput
           * on AutocompleteInput and AutocompleteArrayInput if you don't set the filterToQuery prop accordingly
           * (by default you would receive a filter object like: {q: <query value>})
           */
          _where: pipe(
            toPairs,
            map(([k, v]) => operations.like(k, v)),
            join('~and')
          )(filter)
        })
      );

      const { data: response } = await axios(`${apiUrl}/api/${resource}?${queryString}`);

      return {
        data: map((row) => (decorators[resource] ? decorators[resource](row) : row), response),
        total: rows
      };
    },
    getOne: async (resource, { id }) => {
      const { data } = await axios(`${apiUrl}/api/${resource}/${id}`);

      return { data: data[0] };
    },
    getMany: async (resource, { ids }) => {
      const queryString = stringify({ _ids: join(',', ids) });
      const { data } = await axios(`${apiUrl}/api/${resource}/bulk?${queryString}`);

      return { data };
    },
    getManyReference: async (resource, { id, pagination, sort, target }) => {
      const { data: countData } = await axios(`${apiUrl}/api/${resource}/count`);

      const rows = countData[0].no_of_rows;
      if (rows < 1) return { data: [], total: 0 };

      const { page, perPage } = pagination;
      const { field, order } = sort;

      const queryString = stringify({
        _p: page - 1,
        _size: perPage,
        _sort: `${ORDER_TOKEN[order]}${field}`,
        _where: operations.eq(target, id)
      });

      const { data: response } = await axios(`${apiUrl}/api/${resource}?${queryString}`);

      return {
        data: map((row) => (decorators[resource] ? decorators[resource](row) : row), response),
        total: rows
      };
    },
    update: async (resource, { data: inputData }) => {
      const { data } = await axios.put(
        `${apiUrl}/api/${resource}`,
        decorators[`-${resource}`] ? decorators[`-${resource}`](inputData) : inputData
      );

      return { data };
    },
    updateMany: (resource, { ids, data: inputData }) =>
      Promise.all(
        ids.map(async (id) => {
          const { data } = await axios.put(
            `${apiUrl}/api/${resource}`,
            decorators[`-${resource}`] ? decorators[`-${resource}`]({ ...inputData, id }) : { ...inputData, id }
          );

          return { data };
        })
      ),
    create: async (resource, { data: inputData }) => {
      const { data } = await axios.post(
        `${apiUrl}/api/${resource}`,
        decorators[`-${resource}`] ? decorators[`-${resource}`](inputData) : inputData
      );

      return { data: { ...data, id: data.insertId } };
    },
    delete: async (resource, { id, data: inputData }) => {
      const { data } = await axios.delete(
        `${apiUrl}/api/${resource}/${id}`,
        decorators[`-${resource}`] ? decorators[`-${resource}`](inputData) : inputData
      );

      return { data };
    },
    deleteMany: async (resource, { ids }) => {
      const queryString = stringify({ _ids: join(',', ids) });
      const { data } = await axios.delete(`${apiUrl}/api/${resource}/bulk?${queryString}`);

      return { data };
    }
  };
};
