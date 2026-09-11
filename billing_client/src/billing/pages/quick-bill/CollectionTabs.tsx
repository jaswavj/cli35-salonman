import React from 'react';

export type CollectionTab = 'collection' | 'accounts';

type Props = {
  tab: CollectionTab;
  onChange: (tab: CollectionTab) => void;
};

const CollectionTabs: React.FC<Props> = ({ tab, onChange }) => (
  <div className="qb-tabs" role="tablist">
    <button type="button" className={tab === 'collection' ? 'on' : ''} onClick={() => onChange('collection')}>
      Collection
    </button>
    <button type="button" className={tab === 'accounts' ? 'on' : ''} onClick={() => onChange('accounts')}>
      Accounts
    </button>
  </div>
);

export default CollectionTabs;
