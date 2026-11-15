<script lang="ts">
  import { PageHeader, RouterLink, usePageTitle } from '@/ui/app';
  import { PHASES, WAVES } from './screens';

  /** `/map`: the Parcours screen map, every screen linking to its route. */
  usePageTitle('Screen map · Microcks');
</script>

<PageHeader title="From contract to proof" /><p>
  19 screens across 8 steps, delivered in 7 waves by priority:<!----> <!---->{WAVES.map((name, i) => `W${i + 1} ${name}`).join(', ')}<!---->.
</p>{#each PHASES as phase (phase.step)}<section aria-labelledby="phase-{phase.step}">
    <h2 id="phase-{phase.step}">Step <!---->{phase.step}<!----> · <!---->{phase.name}</h2><p>{phase.verb}</p><ul class="demo-map">
      {#each phase.screens as screen (screen.n)}<li class="panel">
          <h3><span>{screen.n}</span> · <RouterLink to={screen.href}>{screen.title}</RouterLink></h3><p>
            <code>{screen.route}</code> · Wave <!---->{screen.wave}<!----> (<!---->{WAVES[screen.wave - 1]}<!---->)
          </p><p>{screen.what}</p><p>{screen.wow}</p>
        </li>{/each}
    </ul>
  </section>{/each}<p>
  Cross-cutting: navigation shell, ⌘K command bar, drop a contract anywhere, light and dark theme. Out of scope:
  Keycloak login, About page, contextual help.
</p>
