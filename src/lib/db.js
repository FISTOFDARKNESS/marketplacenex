import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

const sql = neon(process.env.DATABASE_URL);

const TABLE = {
  user: 'User', session: 'Session', otpChallenge: 'OtpChallenge',
  auditLog: 'AuditLog', pushSubscription: 'PushSubscription',
  asset: 'Asset', assetLike: 'AssetLike', assetDownload: 'AssetDownload',
  assetReview: 'AssetReview', assetComment: 'AssetComment',
  follow: 'Follow', notification: 'Notification', report: 'Report',
  item: 'Item', seller: 'Seller', sellerProfile: 'SellerProfile',
  sellerItem: 'SellerItem', userItem: 'UserItem', order: 'Order',
  transaction: 'Transaction', withdrawal: 'Withdrawal',
  depositOrder: 'DepositOrder', priceAlert: 'PriceAlert',
  wishlist: 'Wishlist', robloxVerification: 'RobloxVerification',
  remoteSession: 'RemoteSession',
};

function t(model) { return TABLE[model] || model; }
function q(id) { return `"${id}"`; }

function toSnake(name) {
  return name.replace(/[A-Z]/g, l => '_' + l.toLowerCase()).replace(/^_/, '');
}

const REL = {};

function addRel(model, rel, fk, target) {
  if (!REL[model]) REL[model] = {};
  REL[model][rel] = { fk, target, type: 'belongsTo' };
}

function addHasMany(model, rel, fk, target) {
  if (!REL[model]) REL[model] = {};
  REL[model][rel] = { fk, target, type: 'hasMany' };
}

addRel('follow', 'follower', 'followerId', 'User');
addRel('follow', 'following', 'followingId', 'User');
addRel('asset', 'owner', 'ownerId', 'User');
addRel('assetLike', 'asset', 'assetId', 'Asset');
addRel('assetLike', 'user', 'userId', 'User');
addRel('assetDownload', 'asset', 'assetId', 'Asset');
addRel('assetDownload', 'user', 'userId', 'User');
addRel('assetReview', 'asset', 'assetId', 'Asset');
addRel('assetReview', 'user', 'userId', 'User');
addRel('assetComment', 'asset', 'assetId', 'Asset');
addRel('assetComment', 'user', 'userId', 'User');
addRel('notification', 'user', 'userId', 'User');
addRel('session', 'user', 'userId', 'User');
addRel('otpChallenge', 'user', 'userId', 'User');
addRel('auditLog', 'user', 'userId', 'User');
addRel('pushSubscription', 'user', 'userId', 'User');
addRel('report', 'reporter', 'reporterId', 'User');
addRel('sellerItem', 'item', 'itemId', 'Item');
addRel('sellerItem', 'seller', 'sellerId', 'Seller');
addRel('sellerItem', 'user', 'userId', 'User');
addRel('userItem', 'item', 'itemId', 'Item');
addRel('userItem', 'user', 'userId', 'User');
addRel('order', 'item', 'itemId', 'Item');
addRel('order', 'user', 'userId', 'User');
addRel('transaction', 'buyer', 'buyerId', 'User');
addRel('transaction', 'seller', 'sellerId', 'User');
addRel('priceAlert', 'item', 'itemId', 'Item');
addRel('priceAlert', 'user', 'userId', 'User');
addRel('wishlist', 'item', 'itemId', 'Item');
addRel('wishlist', 'user', 'userId', 'User');

addHasMany('sellerProfile', 'items', 'sellerId', 'SellerItem');
addHasMany('asset', 'likes', 'assetId', 'AssetLike');
addHasMany('asset', 'reviews', 'assetId', 'AssetReview');
addHasMany('asset', 'comments', 'assetId', 'AssetComment');
addHasMany('asset', 'downloadsRel', 'assetId', 'AssetDownload');
addHasMany('user', 'pushSubscriptions', 'userId', 'PushSubscription');
addHasMany('user', 'sessions', 'userId', 'Session');
addHasMany('user', 'assets', 'ownerId', 'Asset');

export { sql };

function convertRow(row) {
  if (!row || typeof row !== 'object') return row;
  if (Array.isArray(row)) return row.map(convertRow);
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === 'bigint' ? Number(v) : (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) ? convertRow(v) : v);
  }
  return out;
}

function wrapResult(promise) {
  return promise.then(r => {
    if (r === null || r === undefined) return r;
    return Array.isArray(r) ? r.map(convertRow) : convertRow(r);
  });
}

function exec(sqlStr, params = []) {
  return params.length > 0 ? sql(sqlStr, params) : sql(sqlStr);
}

function buildWhereConds(where) {
  if (!where || Object.keys(where).length === 0) return { clause: '', params: [] };
  const params = [];
  const conds = [];

  for (const [key, val] of Object.entries(where)) {
    if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
      if (key.includes('_')) {
        const fields = key.split('_');
        for (const f of fields) {
          if (val[f] !== undefined) {
            params.push(val[f]);
            conds.push(`${q(f)} = $${params.length}`);
          }
        }
      } else if (val.not !== undefined) {
        params.push(val.not);
        conds.push(`${q(key)} != $${params.length}`);
      } else if (val.in !== undefined && Array.isArray(val.in)) {
        const items = val.in;
        const phs = items.map(item => { params.push(item); return `$${params.length}`; });
        conds.push(`${q(key)} IN (${phs.join(', ')})`);
      } else if (val.contains !== undefined) {
        params.push(`%${val.contains}%`);
        conds.push(`${q(key)} LIKE $${params.length}`);
      } else if (val.gt !== undefined) { params.push(val.gt); conds.push(`${q(key)} > $${params.length}`); }
      else if (val.gte !== undefined) { params.push(val.gte); conds.push(`${q(key)} >= $${params.length}`); }
      else if (val.lt !== undefined) { params.push(val.lt); conds.push(`${q(key)} < $${params.length}`); }
      else if (val.lte !== undefined) { params.push(val.lte); conds.push(`${q(key)} <= $${params.length}`); }
    } else {
      params.push(val);
      conds.push(`${q(key)} = $${params.length}`);
    }
  }
  return { clause: conds.length ? 'WHERE ' + conds.join(' AND ') : '', params };
}

function buildSelect(fields) {
  if (!fields || Object.keys(fields).length === 0) return '*';
  return Object.keys(fields).map(f => q(f)).join(', ');
}

function buildOrderBy(orderBy) {
  if (!orderBy) return '';
  const entries = Object.entries(orderBy);
  if (entries.length === 0) return '';
  return 'ORDER BY ' + entries.map(([k, v]) => `${q(k)} ${v === 'desc' ? 'DESC' : 'ASC'}`).join(', ');
}

function buildSet(data) {
  const params = [];
  const sets = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
        if (val.decrement !== undefined) { params.push(val.decrement); sets.push(`${q(key)} = ${q(key)} - $${params.length}`); }
        else if (val.increment !== undefined) { params.push(val.increment); sets.push(`${q(key)} = ${q(key)} + $${params.length}`); }
        else if (val.set !== undefined) { params.push(val.set); sets.push(`${q(key)} = $${params.length}`); }
      } else {
        params.push(val);
        sets.push(`${q(key)} = $${params.length}`);
      }
    }
  }
  return { clause: sets.join(', '), params };
}

function adjustParams(sqlStr, params, offset) {
  if (offset === 0) return sqlStr;
  return sqlStr.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + offset}`);
}

async function attachIncludes(rows, include, model, isMany) {
  if (!include || !rows || (Array.isArray(rows) && rows.length === 0)) return rows;
  const items = Array.isArray(rows) ? rows : [rows];
  const modelRels = REL[model];
  if (!modelRels) return isMany ? items : items[0];

  for (const [rel, config] of Object.entries(include)) {
    const relDef = modelRels[rel];
    if (!relDef) continue;

    const relConfig = config === true ? {} : config;
    const relSelect = relConfig?.select;
    const relWhere = relConfig?.where || {};
    const relOrderBy = relConfig?.orderBy;
    const relInclude = relConfig?.include;

    if (relDef.type === 'belongsTo') {
      const fkValues = [...new Set(items.map(r => r[relDef.fk]).filter(Boolean))];
      if (fkValues.length === 0) continue;
      const { clause, params } = buildWhereConds({ id: { in: fkValues }, ...relWhere });
      const order = buildOrderBy(relOrderBy);
      const fields = buildSelect(relSelect);
      const qStr = `SELECT ${fields} FROM ${q(relDef.target)} ${clause} ${order}`;
      const related = await exec(qStr, params);
      const relatedMap = {};
      for (const r of related) { relatedMap[r.id] = r; }
      for (const item of items) {
        const rel = relatedMap[item[relDef.fk]];
        if (rel && relSelect && Object.keys(relSelect).length > 0) {
          const f = {};
          for (const k of Object.keys(relSelect)) f[k] = rel[k];
          item[rel] = f;
        } else {
          item[rel] = rel || null;
        }
      }
    } else if (relDef.type === 'hasMany') {
      const ids = items.map(r => r.id);
      if (ids.length === 0) continue;
      const { clause: wClause, params: wParams } = buildWhereConds({ [relDef.fk]: { in: ids }, ...relWhere });
      const order = buildOrderBy(relOrderBy);
      const fields = buildSelect(relSelect);
      const qStr = `SELECT ${fields} FROM ${q(relDef.target)} ${wClause} ${order}`;
      const related = await exec(qStr, wParams);

      if (relInclude) {
        await attachIncludes(related, relInclude, relDef.target, true);
      }

      const grouped = {};
      for (const r of related) {
        const fk = r[relDef.fk];
        if (!grouped[fk]) grouped[fk] = [];
        grouped[fk].push(r);
      }
      for (const item of items) {
        item[rel] = grouped[item.id] || [];
      }
    }
  }

  return isMany ? items : items[0];
}

const OPERATIONS = {
  findUnique(table, args) {
    const where = args?.where || {};
    const select = args?.select;
    const include = args?.include;
    const { clause, params } = buildWhereConds(where);
    const fields = buildSelect(select);
    return wrapResult(
      exec(`SELECT ${fields} FROM ${q(table)} ${clause} LIMIT 1`, params)
        .then(r => r[0] || null)
        .then(r => r && include ? attachIncludes(r, include, table, false) : r)
    );
  },

  findFirst(table, args) {
    const where = args?.where || {};
    const select = args?.select;
    const include = args?.include;
    const orderBy = args?.orderBy;
    const { clause, params } = buildWhereConds(where);
    const order = buildOrderBy(orderBy);
    const fields = buildSelect(select);
    return wrapResult(
      exec(`SELECT ${fields} FROM ${q(table)} ${clause} ${order} LIMIT 1`, params)
        .then(r => r[0] || null)
        .then(r => r && include ? attachIncludes(r, include, table, false) : r)
    );
  },

  findMany(table, args) {
    const where = args?.where || {};
    const select = args?.select;
    const include = args?.include;
    const orderBy = args?.orderBy;
    const skip = args?.skip;
    const take = args?.take;
    const { clause, params } = buildWhereConds(where);
    const order = buildOrderBy(orderBy);
    const fields = buildSelect(select);
    let qStr = `SELECT ${fields} FROM ${q(table)} ${clause} ${order}`;
    if (take !== undefined) qStr += ` LIMIT ${take}`;
    if (skip !== undefined) qStr += ` OFFSET ${skip}`;
    return wrapResult(
      exec(qStr, params).then(r => include ? attachIncludes(r, include, table, true) : r)
    );
  },

  count(table, args) {
    const where = args?.where || {};
    const { clause, params } = buildWhereConds(where);
    return exec(`SELECT COUNT(*)::int AS count FROM ${q(table)} ${clause}`, params).then(r => r[0]?.count || 0);
  },

  create(table, args) {
    const data = args?.data || {};
    if (!data.id) data.id = randomUUID();
    const keys = Object.keys(data);
    const vals = keys.map(k => data[k]);
    return wrapResult(
      exec(
        `INSERT INTO ${q(table)} (${keys.map(k => q(k)).join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
        vals
      ).then(r => r[0])
    );
  },

  update(table, args) {
    const where = args?.where || {};
    const data = args?.data || {};
    const { clause: wClause, params: wParams } = buildWhereConds(where);
    const { clause: sClause, params: sParams } = buildSet(data);
    if (!sClause) return exec(`SELECT * FROM ${q(table)} ${wClause} LIMIT 1`, wParams).then(r => r[0] || null);
    const allP = [...sParams, ...wParams];
    const adjusted = adjustParams(wClause, wParams, sParams.length);
    return wrapResult(exec(`UPDATE ${q(table)} SET ${sClause} ${adjusted} RETURNING *`, allP).then(r => r[0] || null));
  },

  updateMany(table, args) {
    const where = args?.where || {};
    const data = args?.data || {};
    const { clause: wClause, params: wParams } = buildWhereConds(where);
    const { clause: sClause, params: sParams } = buildSet(data);
    if (!sClause) return Promise.resolve([]);
    const allP = [...sParams, ...wParams];
    const adjusted = adjustParams(wClause, wParams, sParams.length);
    return exec(`UPDATE ${q(table)} SET ${sClause} ${adjusted}`, allP);
  },

  delete(table, args) {
    const where = args?.where || {};
    const { clause, params } = buildWhereConds(where);
    return wrapResult(exec(`DELETE FROM ${q(table)} ${clause}`, params).then(r => r[0] || null));
  },

  deleteMany(table, args) {
    const where = args?.where || {};
    const { clause, params } = buildWhereConds(where);
    return exec(`DELETE FROM ${q(table)} ${clause}`, params);
  },

  upsert(table, args) {
    const where = args?.where || {};
    const updateData = args?.update || {};
    const createData = args?.create || {};
    const { clause: wClause, params: wParams } = buildWhereConds(where);

    let conflictCols;
    if (wClause) {
      const m = wClause.match(/WHERE\s+(.+?)$/);
      if (m) conflictCols = m[1].split(' AND ').map(c => c.split('=')[0].trim()).join(', ');
    }
    if (!conflictCols) conflictCols = q(Object.keys(where)[0] || 'id');

    const cKeys = Object.keys(createData);
    const cVals = cKeys.map(k => createData[k]);
    const { clause: sClause } = buildSet(updateData);

    return wrapResult(exec(
      `INSERT INTO ${q(table)} (${cKeys.map(k => q(k)).join(', ')}) VALUES (${cKeys.map((_, i) => `$${i + 1}`).join(', ')}) ON CONFLICT (${conflictCols}) DO UPDATE SET ${sClause} RETURNING *`,
      cVals
    ).then(r => r[0]));
  },

  aggregate(table, args) {
    const where = args?.where || {};
    const { clause, params } = buildWhereConds(where);
    const sum = args?._sum;
    if (sum) {
      const field = Object.keys(sum)[0];
      return wrapResult(exec(`SELECT COALESCE(SUM(${q(field)}), 0)::int AS sum FROM ${q(table)} ${clause}`, params).then(r => r[0]));
    }
    return wrapResult(exec(`SELECT * FROM ${q(table)} ${clause}`, params));
  },
};

export const prisma = new Proxy({}, {
  get(target, modelName) {
    if (modelName === '$transaction') {
      return async (operations) => {
        const results = [];
        for (const op of operations) results.push(await op);
        return results;
      };
    }
    if (modelName === 'then' || modelName === 'catch' || modelName === 'finally') return undefined;
    if (typeof modelName === 'symbol') return undefined;

    const table = t(modelName);
    return new Proxy({}, {
      get(opTarget, method) {
        if (OPERATIONS[method]) return (args) => OPERATIONS[method](table, args);
        return undefined;
      },
    });
  },
});
