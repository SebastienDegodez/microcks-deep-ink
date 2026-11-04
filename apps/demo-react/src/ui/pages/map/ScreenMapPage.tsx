import { Link } from 'react-router';
import { PageHeader, usePageTitle } from '@/ui/app';
import { PHASES, WAVES } from './screens';

/** `/map`: the Parcours screen map, every screen linking to its route. */
export default function ScreenMapPage() {
  usePageTitle('Screen map · Microcks');
  return (
    <>
      <PageHeader title="From contract to proof" />
      <p>
        19 screens across 8 steps, delivered in 7 waves by priority:{' '}
        {WAVES.map((name, i) => `W${i + 1} ${name}`).join(', ')}.
      </p>
      {PHASES.map((phase) => (
        <section key={phase.step} aria-labelledby={`phase-${phase.step}`}>
          <h2 id={`phase-${phase.step}`}>
            Step {phase.step} · {phase.name}
          </h2>
          <p>{phase.verb}</p>
          <ul className="demo-map">
            {phase.screens.map((screen) => (
              <li key={screen.n} className="panel">
                <h3>
                  <span>{screen.n}</span> · <Link to={screen.href}>{screen.title}</Link>
                </h3>
                <p>
                  <code>{screen.route}</code> · Wave {screen.wave} ({WAVES[screen.wave - 1]})
                </p>
                <p>{screen.what}</p>
                <p>{screen.wow}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p>
        Cross-cutting: navigation shell, ⌘K command bar, drop a contract anywhere, light and dark theme. Out of scope:
        Keycloak login, About page, contextual help.
      </p>
    </>
  );
}
