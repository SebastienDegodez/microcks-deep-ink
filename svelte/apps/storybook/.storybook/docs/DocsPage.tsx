import React from 'react';
import { Controls, Description, Primary, Stories, Subtitle, Title, useOf } from '@storybook/addon-docs/blocks';
import { itemNameOf, registryItem, type RegistryItemDoc } from './registry-items';

function useItem(): RegistryItemDoc | undefined {
  const { preparedMeta } = useOf('meta', ['meta']);
  return registryItem(itemNameOf(preparedMeta.parameters));
}

/** The registry description of the item, shown under the page title. */
export function ItemDescription() {
  const item = useItem();
  return item ? <p className="deep-ink-docs-lead">{item.description}</p> : null;
}

/** Accessibility contract of the item: pattern, keyboard interactions, roles and ARIA, references. */
export function A11yContract() {
  const item = useItem();
  if (!item?.a11y) return null;
  const { pattern, keyboard, aria, rgaa, wcag, notes } = item.a11y;
  return (
    <section aria-labelledby="deep-ink-a11y">
      <h2 id="deep-ink-a11y">Accessibility</h2>
      <p>
        <strong>Pattern.</strong> {pattern}
      </p>
      <h3 id="deep-ink-a11y-keyboard">Keyboard interactions</h3>
      {keyboard.length ? (
        <table aria-labelledby="deep-ink-a11y-keyboard">
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {keyboard.map(([key, action]) => (
              <tr key={key}>
                <th scope="row">
                  <kbd>{key}</kbd>
                </th>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No keyboard interaction: the component is not focusable.</p>
      )}
      <h3 id="deep-ink-a11y-aria">Roles and ARIA</h3>
      {aria.length ? (
        <ul aria-labelledby="deep-ink-a11y-aria">
          {aria.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : (
        <p>No ARIA attribute: native semantics only.</p>
      )}
      <h3>References</h3>
      <p>
        RGAA 4.1.2: {rgaa.length ? rgaa.join(', ') : 'none'}. WCAG 2.1: {wcag.length ? wcag.join(', ') : 'none'}.
      </p>
      {notes ? <p>{notes}</p> : null}
      <p>
        <em>Automated checks (axe, a11ylint) do not replace a human audit: this component is not audited.</em>
      </p>
    </section>
  );
}

/** Autodocs page: the default blocks plus the registry description and accessibility contract. */
export function DocsPage() {
  return (
    <>
      <Title />
      <Subtitle />
      <ItemDescription />
      <Description />
      <Primary />
      <Controls />
      <A11yContract />
      <Stories />
    </>
  );
}
