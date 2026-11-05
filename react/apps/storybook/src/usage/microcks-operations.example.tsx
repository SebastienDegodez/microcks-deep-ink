import { useState } from 'react';
import { OperationList, OperationRow } from '@microcks/deep-ink';

const OPERATIONS = [
  { method: 'GET', path: '/pastries', meta: '3 examples' },
  { method: 'GET', path: '/pastries/{name}', meta: '3 examples · URI_PARTS' },
  { method: 'PATCH', path: '/pastries/{name}', meta: '1 example · URI_PARTS' },
];

export default function Operations() {
  const [selected, setSelected] = useState('GET /pastries');
  return (
    <OperationList label="Operations of API Pastry 2.0" style={{ maxWidth: 640 }}>
      {OPERATIONS.map(({ method, path, meta }) => {
        const key = `${method} ${path}`;
        return (
          <OperationRow
            key={key}
            method={method}
            path={path}
            meta={meta}
            selected={selected === key}
            mockUrl={`http://localhost:8080/rest/API+Pastry/2.0${path}`}
            onSelect={() => setSelected(key)}
          />
        );
      })}
    </OperationList>
  );
}
