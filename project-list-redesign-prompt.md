This is a UI design exported as HTML/CSS from Banani. Integrate it into my project, adapting it to match my existing tech stack, component library, and styles. Preserve the layout, spacing, and visual design as closely as possible.

Instructions:

- Convert the HTML/CSS into components that fit my project's framework and conventions
- Replace inline styles with my project's styling approach Tailwind classes
- use all shadcn components do not create a new component related to UI util it not provided by shadcn
- create compose based on the functionality if required
- reuse current code as much as possible just update the visaul details
- keep the current functionality intact like drap and drop drag and reordering task and other things 
- Use existing UI components from my project where appropriate
- Ensure the result is responsive and accessible
- Remove any Banani-specific artifacts (export wrappers, CDN scripts)

```html
<design>
  <div
    class="export-wrapper"
    style="
    width: 1440px;
    min-height: 812px;
    position: relative;
    font-family: var(--font-family-body);
    background-color: var(--background);
  "
  >
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@100;200;300;400;500;600;700;800;900&family=Geist:wght@100;200;300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@100;200;300;400;500;600;700&family=IBM+Plex+Sans:wght@100;200;300;400;500;600;700&family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Nunito:wght@200;300;400;500;600;700;800;900&family=PT+Serif:wght@400;700&family=Roboto+Slab:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&family=Shantell+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <html>
      <head>
        <style>
          /*! tailwindcss v4.3.0 | MIT License | https://tailwindcss.com */
          @layer properties;
          @layer theme, base, components, utilities;
          @layer theme {
            :root,
            :root {
              --font-sans:
                ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
                "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
              --font-mono:
                ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
                "Liberation Mono", "Courier New", monospace;
              --spacing: 0.25rem;
              --text-xs: 11px;
              --text-xs--line-height: calc(1 / 0.75);
              --text-sm: 13px;
              --text-sm--line-height: calc(1.25 / 0.875);
              --text-2xl: 22px;
              --text-2xl--line-height: calc(2 / 1.5);
              --font-weight-medium: 500;
              --font-weight-semibold: 600;
              --font-weight-bold: 700;
              --tracking-wider: 0.05em;
              --leading-snug: 1.375;
              --radius-sm: 4px;
              --radius-md: 6px;
              --radius-lg: 10px;
              --default-font-family: var(--font-sans);
              --default-mono-font-family: var(--font-mono);
              --radius: var(--radius-sm);
              --color-background: #0f1117;
              --color-foreground: #e8eaf0;
              --color-border: #2a2d35;
              --color-input: #1a1d26;
              --color-primary: #4f8ef7;
              --color-primary-foreground: #ffffff;
              --color-secondary: #1e2130;
              --color-secondary-foreground: #9ba3b5;
              --color-muted: #2a2d38;
              --color-muted-foreground: #6b7280;
              --color-surface: #181b24;
              --color-success: #22c55e;
              --color-warning: #f59e0b;
              --color-danger: #ef4444;
              --color-accent: #7c3aed;
              --font-body: Inter;
              --font-headings: Inter;
            }
          }
          @layer base {
            *,
            ::after,
            ::before,
            ::backdrop,
            ::file-selector-button {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              border: 0 solid;
            }
            html,
            :root {
              line-height: 1.5;
              -webkit-text-size-adjust: 100%;
              tab-size: 4;
              font-family: var(
                --default-font-family,
                ui-sans-serif,
                system-ui,
                sans-serif,
                "Apple Color Emoji",
                "Segoe UI Emoji",
                "Segoe UI Symbol",
                "Noto Color Emoji"
              );
              font-feature-settings: var(
                --default-font-feature-settings,
                normal
              );
              font-variation-settings: var(
                --default-font-variation-settings,
                normal
              );
              -webkit-tap-highlight-color: transparent;
            }
            hr {
              height: 0;
              color: inherit;
              border-top-width: 1px;
            }
            abbr:where([title]) {
              -webkit-text-decoration: underline dotted;
              text-decoration: underline dotted;
            }
            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
              font-size: inherit;
              font-weight: inherit;
            }
            a {
              color: inherit;
              -webkit-text-decoration: inherit;
              text-decoration: inherit;
            }
            b,
            strong {
              font-weight: bolder;
            }
            code,
            kbd,
            samp,
            pre {
              font-family: var(
                --default-mono-font-family,
                ui-monospace,
                SFMono-Regular,
                Menlo,
                Monaco,
                Consolas,
                "Liberation Mono",
                "Courier New",
                monospace
              );
              font-feature-settings: var(
                --default-mono-font-feature-settings,
                normal
              );
              font-variation-settings: var(
                --default-mono-font-variation-settings,
                normal
              );
              font-size: 1em;
            }
            small {
              font-size: 80%;
            }
            sub,
            sup {
              font-size: 75%;
              line-height: 0;
              position: relative;
              vertical-align: baseline;
            }
            sub {
              bottom: -0.25em;
            }
            sup {
              top: -0.5em;
            }
            table {
              text-indent: 0;
              border-color: inherit;
              border-collapse: collapse;
            }
            :-moz-focusring {
              outline: auto;
            }
            progress {
              vertical-align: baseline;
            }
            summary {
              display: list-item;
            }
            ol,
            ul,
            menu {
              list-style: none;
            }
            img,
            svg,
            video,
            canvas,
            audio,
            iframe,
            embed,
            object {
              display: block;
              vertical-align: middle;
            }
            img,
            video {
              max-width: 100%;
              height: auto;
            }
            button,
            input,
            select,
            optgroup,
            textarea,
            ::file-selector-button {
              font: inherit;
              font-feature-settings: inherit;
              font-variation-settings: inherit;
              letter-spacing: inherit;
              color: inherit;
              border-radius: 0;
              background-color: transparent;
              opacity: 1;
            }
            :where(select:is([multiple], [size])) optgroup {
              font-weight: bolder;
            }
            :where(select:is([multiple], [size])) optgroup option {
              padding-inline-start: 20px;
            }
            ::file-selector-button {
              margin-inline-end: 4px;
            }
            ::placeholder {
              opacity: 1;
            }
            @supports (not (-webkit-appearance: -apple-pay-button)) or
              (contain-intrinsic-size: 1px) {
              ::placeholder {
                color: currentcolor;
                @supports (color: color-mix(in lab, red, red)) {
                  color: color-mix(in oklab, currentcolor 50%, transparent);
                }
              }
            }
            textarea {
              resize: vertical;
            }
            ::-webkit-search-decoration {
              -webkit-appearance: none;
            }
            ::-webkit-date-and-time-value {
              min-height: 1lh;
              text-align: inherit;
            }
            ::-webkit-datetime-edit {
              display: inline-flex;
            }
            ::-webkit-datetime-edit-fields-wrapper {
              padding: 0;
            }
            ::-webkit-datetime-edit,
            ::-webkit-datetime-edit-year-field,
            ::-webkit-datetime-edit-month-field,
            ::-webkit-datetime-edit-day-field,
            ::-webkit-datetime-edit-hour-field,
            ::-webkit-datetime-edit-minute-field,
            ::-webkit-datetime-edit-second-field,
            ::-webkit-datetime-edit-millisecond-field,
            ::-webkit-datetime-edit-meridiem-field {
              padding-block: 0;
            }
            ::-webkit-calendar-picker-indicator {
              line-height: 1;
            }
            :-moz-ui-invalid {
              box-shadow: none;
            }
            button,
            input:where([type="button"], [type="reset"], [type="submit"]),
            ::file-selector-button {
              appearance: button;
            }
            ::-webkit-inner-spin-button,
            ::-webkit-outer-spin-button {
              height: auto;
            }
            [hidden]:where(:not([hidden="until-found"])) {
              display: none !important;
            }
          }
          @layer utilities {
            .mx-1 {
              margin-inline: calc(var(--spacing) * 1);
            }
            .mx-3 {
              margin-inline: calc(var(--spacing) * 3);
            }
            .mt-0\.5 {
              margin-top: calc(var(--spacing) * 0.5);
            }
            .mt-1 {
              margin-top: calc(var(--spacing) * 1);
            }
            .mt-1\.5 {
              margin-top: calc(var(--spacing) * 1.5);
            }
            .mb-0\.5 {
              margin-bottom: calc(var(--spacing) * 0.5);
            }
            .mb-1 {
              margin-bottom: calc(var(--spacing) * 1);
            }
            .mb-2 {
              margin-bottom: calc(var(--spacing) * 2);
            }
            .mb-2\.5 {
              margin-bottom: calc(var(--spacing) * 2.5);
            }
            .mb-3 {
              margin-bottom: calc(var(--spacing) * 3);
            }
            .-ml-2 {
              margin-left: calc(var(--spacing) * -2);
            }
            .ml-5 {
              margin-left: calc(var(--spacing) * 5);
            }
            .flex {
              display: flex;
            }
            .h-1\.5 {
              height: calc(var(--spacing) * 1.5);
            }
            .h-2 {
              height: calc(var(--spacing) * 2);
            }
            .h-4 {
              height: calc(var(--spacing) * 4);
            }
            .h-5 {
              height: calc(var(--spacing) * 5);
            }
            .h-6 {
              height: calc(var(--spacing) * 6);
            }
            .h-7 {
              height: calc(var(--spacing) * 7);
            }
            .h-9 {
              height: calc(var(--spacing) * 9);
            }
            .h-12 {
              height: calc(var(--spacing) * 12);
            }
            .h-full {
              height: 100%;
            }
            .w-2 {
              width: calc(var(--spacing) * 2);
            }
            .w-4 {
              width: calc(var(--spacing) * 4);
            }
            .w-5 {
              width: calc(var(--spacing) * 5);
            }
            .w-6 {
              width: calc(var(--spacing) * 6);
            }
            .w-7 {
              width: calc(var(--spacing) * 7);
            }
            .w-8 {
              width: calc(var(--spacing) * 8);
            }
            .w-9 {
              width: calc(var(--spacing) * 9);
            }
            .w-10 {
              width: calc(var(--spacing) * 10);
            }
            .w-20 {
              width: calc(var(--spacing) * 20);
            }
            .w-24 {
              width: calc(var(--spacing) * 24);
            }
            .w-28 {
              width: calc(var(--spacing) * 28);
            }
            .w-32 {
              width: calc(var(--spacing) * 32);
            }
            .w-36 {
              width: calc(var(--spacing) * 36);
            }
            .w-60 {
              width: calc(var(--spacing) * 60);
            }
            .w-72 {
              width: calc(var(--spacing) * 72);
            }
            .w-full {
              width: 100%;
            }
            .w-px {
              width: 1px;
            }
            .max-w-96 {
              max-width: calc(var(--spacing) * 96);
            }
            .min-w-0 {
              min-width: calc(var(--spacing) * 0);
            }
            .min-w-80 {
              min-width: calc(var(--spacing) * 80);
            }
            .flex-1 {
              flex: 1;
            }
            .flex-shrink-0 {
              flex-shrink: 0;
            }
            .flex-col {
              flex-direction: column;
            }
            .flex-wrap {
              flex-wrap: wrap;
            }
            .items-center {
              align-items: center;
            }
            .items-start {
              align-items: flex-start;
            }
            .justify-between {
              justify-content: space-between;
            }
            .justify-center {
              justify-content: center;
            }
            .justify-end {
              justify-content: flex-end;
            }
            .gap-0 {
              gap: calc(var(--spacing) * 0);
            }
            .gap-0\.5 {
              gap: calc(var(--spacing) * 0.5);
            }
            .gap-1 {
              gap: calc(var(--spacing) * 1);
            }
            .gap-1\.5 {
              gap: calc(var(--spacing) * 1.5);
            }
            .gap-2 {
              gap: calc(var(--spacing) * 2);
            }
            .gap-2\.5 {
              gap: calc(var(--spacing) * 2.5);
            }
            .gap-3 {
              gap: calc(var(--spacing) * 3);
            }
            .gap-4 {
              gap: calc(var(--spacing) * 4);
            }
            .gap-5 {
              gap: calc(var(--spacing) * 5);
            }
            .truncate {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .overflow-hidden {
              overflow: hidden;
            }
            .overflow-visible {
              overflow: visible;
            }
            .overflow-x-auto {
              overflow-x: auto;
            }
            .overflow-y-hidden {
              overflow-y: hidden;
            }
            .rounded {
              border-radius: var(--radius);
            }
            .rounded-full {
              border-radius: calc(infinity * 1px);
            }
            .rounded-lg {
              border-radius: var(--radius-lg);
            }
            .rounded-md {
              border-radius: var(--radius-md);
            }
            .border {
              border-style: var(--tw-border-style);
              border-width: 1px;
            }
            .border-2 {
              border-style: var(--tw-border-style);
              border-width: 2px;
            }
            .border-t {
              border-top-style: var(--tw-border-style);
              border-top-width: 1px;
            }
            .border-r {
              border-right-style: var(--tw-border-style);
              border-right-width: 1px;
            }
            .border-b {
              border-bottom-style: var(--tw-border-style);
              border-bottom-width: 1px;
            }
            .border-l {
              border-left-style: var(--tw-border-style);
              border-left-width: 1px;
            }
            .border-border {
              border-color: var(--color-border);
            }
            .border-surface {
              border-color: var(--color-surface);
            }
            .bg-accent {
              background-color: var(--color-accent);
            }
            .bg-background {
              background-color: var(--color-background);
            }
            .bg-border {
              background-color: var(--color-border);
            }
            .bg-danger {
              background-color: var(--color-danger);
            }
            .bg-input {
              background-color: var(--color-input);
            }
            .bg-muted {
              background-color: var(--color-muted);
            }
            .bg-muted-foreground {
              background-color: var(--color-muted-foreground);
            }
            .bg-primary {
              background-color: var(--color-primary);
            }
            .bg-secondary {
              background-color: var(--color-secondary);
            }
            .bg-success {
              background-color: var(--color-success);
            }
            .bg-surface {
              background-color: var(--color-surface);
            }
            .bg-warning {
              background-color: var(--color-warning);
            }
            .p-0\.5 {
              padding: calc(var(--spacing) * 0.5);
            }
            .p-1 {
              padding: calc(var(--spacing) * 1);
            }
            .p-1\.5 {
              padding: calc(var(--spacing) * 1.5);
            }
            .p-3 {
              padding: calc(var(--spacing) * 3);
            }
            .px-1 {
              padding-inline: calc(var(--spacing) * 1);
            }
            .px-1\.5 {
              padding-inline: calc(var(--spacing) * 1.5);
            }
            .px-2 {
              padding-inline: calc(var(--spacing) * 2);
            }
            .px-2\.5 {
              padding-inline: calc(var(--spacing) * 2.5);
            }
            .px-3 {
              padding-inline: calc(var(--spacing) * 3);
            }
            .px-4 {
              padding-inline: calc(var(--spacing) * 4);
            }
            .px-6 {
              padding-inline: calc(var(--spacing) * 6);
            }
            .py-0\.5 {
              padding-block: calc(var(--spacing) * 0.5);
            }
            .py-1\.5 {
              padding-block: calc(var(--spacing) * 1.5);
            }
            .py-2 {
              padding-block: calc(var(--spacing) * 2);
            }
            .py-2\.5 {
              padding-block: calc(var(--spacing) * 2.5);
            }
            .py-3 {
              padding-block: calc(var(--spacing) * 3);
            }
            .pt-2 {
              padding-top: calc(var(--spacing) * 2);
            }
            .pt-3 {
              padding-top: calc(var(--spacing) * 3);
            }
            .pt-5 {
              padding-top: calc(var(--spacing) * 5);
            }
            .pr-4 {
              padding-right: calc(var(--spacing) * 4);
            }
            .pb-2 {
              padding-bottom: calc(var(--spacing) * 2);
            }
            .pb-4 {
              padding-bottom: calc(var(--spacing) * 4);
            }
            .pl-2 {
              padding-left: calc(var(--spacing) * 2);
            }
            .text-center {
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .font-body {
              font-family: var(--font-body);
            }
            .font-headings {
              font-family: var(--font-headings);
            }
            .font-mono {
              font-family: var(--font-mono);
            }
            .text-2xl {
              font-size: var(--text-2xl);
              line-height: var(--tw-leading, var(--text-2xl--line-height));
            }
            .text-sm {
              font-size: var(--text-sm);
              line-height: var(--tw-leading, var(--text-sm--line-height));
            }
            .text-xs {
              font-size: var(--text-xs);
              line-height: var(--tw-leading, var(--text-xs--line-height));
            }
            .leading-none {
              --tw-leading: 1;
              line-height: 1;
            }
            .leading-snug {
              --tw-leading: var(--leading-snug);
              line-height: var(--leading-snug);
            }
            .font-bold {
              --tw-font-weight: var(--font-weight-bold);
              font-weight: var(--font-weight-bold);
            }
            .font-medium {
              --tw-font-weight: var(--font-weight-medium);
              font-weight: var(--font-weight-medium);
            }
            .font-semibold {
              --tw-font-weight: var(--font-weight-semibold);
              font-weight: var(--font-weight-semibold);
            }
            .tracking-wider {
              --tw-tracking: var(--tracking-wider);
              letter-spacing: var(--tracking-wider);
            }
            .text-background {
              color: var(--color-background);
            }
            .text-border {
              color: var(--color-border);
            }
            .text-danger {
              color: var(--color-danger);
            }
            .text-foreground {
              color: var(--color-foreground);
            }
            .text-muted-foreground {
              color: var(--color-muted-foreground);
            }
            .text-primary {
              color: var(--color-primary);
            }
            .text-primary-foreground {
              color: var(--color-primary-foreground);
            }
            .text-secondary-foreground {
              color: var(--color-secondary-foreground);
            }
            .text-success {
              color: var(--color-success);
            }
            .text-warning {
              color: var(--color-warning);
            }
            .uppercase {
              text-transform: uppercase;
            }
            .shadow-sm {
              --tw-shadow:
                0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)),
                0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
              box-shadow:
                var(--tw-inset-shadow), var(--tw-inset-ring-shadow),
                var(--tw-ring-offset-shadow), var(--tw-ring-shadow),
                var(--tw-shadow);
            }
            .filter {
              filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,)
                var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,)
                var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,);
            }
            .first\:ml-0 {
              &:first-child {
                margin-left: calc(var(--spacing) * 0);
              }
            }
          }
          @property --tw-border-style {
            syntax: "*";
            inherits: false;
            initial-value: solid;
          }
          @property --tw-leading {
            syntax: "*";
            inherits: false;
          }
          @property --tw-font-weight {
            syntax: "*";
            inherits: false;
          }
          @property --tw-tracking {
            syntax: "*";
            inherits: false;
          }
          @property --tw-shadow {
            syntax: "*";
            inherits: false;
            initial-value: 0 0 #0000;
          }
          @property --tw-shadow-color {
            syntax: "*";
            inherits: false;
          }
          @property --tw-shadow-alpha {
            syntax: "<percentage>";
            inherits: false;
            initial-value: 100%;
          }
          @property --tw-inset-shadow {
            syntax: "*";
            inherits: false;
            initial-value: 0 0 #0000;
          }
          @property --tw-inset-shadow-color {
            syntax: "*";
            inherits: false;
          }
          @property --tw-inset-shadow-alpha {
            syntax: "<percentage>";
            inherits: false;
            initial-value: 100%;
          }
          @property --tw-ring-color {
            syntax: "*";
            inherits: false;
          }
          @property --tw-ring-shadow {
            syntax: "*";
            inherits: false;
            initial-value: 0 0 #0000;
          }
          @property --tw-inset-ring-color {
            syntax: "*";
            inherits: false;
          }
          @property --tw-inset-ring-shadow {
            syntax: "*";
            inherits: false;
            initial-value: 0 0 #0000;
          }
          @property --tw-ring-inset {
            syntax: "*";
            inherits: false;
          }
          @property --tw-ring-offset-width {
            syntax: "<length>";
            inherits: false;
            initial-value: 0px;
          }
          @property --tw-ring-offset-color {
            syntax: "*";
            inherits: false;
            initial-value: #fff;
          }
          @property --tw-ring-offset-shadow {
            syntax: "*";
            inherits: false;
            initial-value: 0 0 #0000;
          }
          @property --tw-blur {
            syntax: "*";
            inherits: false;
          }
          @property --tw-brightness {
            syntax: "*";
            inherits: false;
          }
          @property --tw-contrast {
            syntax: "*";
            inherits: false;
          }
          @property --tw-grayscale {
            syntax: "*";
            inherits: false;
          }
          @property --tw-hue-rotate {
            syntax: "*";
            inherits: false;
          }
          @property --tw-invert {
            syntax: "*";
            inherits: false;
          }
          @property --tw-opacity {
            syntax: "*";
            inherits: false;
          }
          @property --tw-saturate {
            syntax: "*";
            inherits: false;
          }
          @property --tw-sepia {
            syntax: "*";
            inherits: false;
          }
          @property --tw-drop-shadow {
            syntax: "*";
            inherits: false;
          }
          @property --tw-drop-shadow-color {
            syntax: "*";
            inherits: false;
          }
          @property --tw-drop-shadow-alpha {
            syntax: "<percentage>";
            inherits: false;
            initial-value: 100%;
          }
          @property --tw-drop-shadow-size {
            syntax: "*";
            inherits: false;
          }
          @layer properties {
            @supports ((-webkit-hyphens: none) and (not (margin-trim: inline)))
              or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
              *,
              ::before,
              ::after,
              ::backdrop {
                --tw-border-style: solid;
                --tw-leading: initial;
                --tw-font-weight: initial;
                --tw-tracking: initial;
                --tw-shadow: 0 0 #0000;
                --tw-shadow-color: initial;
                --tw-shadow-alpha: 100%;
                --tw-inset-shadow: 0 0 #0000;
                --tw-inset-shadow-color: initial;
                --tw-inset-shadow-alpha: 100%;
                --tw-ring-color: initial;
                --tw-ring-shadow: 0 0 #0000;
                --tw-inset-ring-color: initial;
                --tw-inset-ring-shadow: 0 0 #0000;
                --tw-ring-inset: initial;
                --tw-ring-offset-width: 0px;
                --tw-ring-offset-color: #fff;
                --tw-ring-offset-shadow: 0 0 #0000;
                --tw-blur: initial;
                --tw-brightness: initial;
                --tw-contrast: initial;
                --tw-grayscale: initial;
                --tw-hue-rotate: initial;
                --tw-invert: initial;
                --tw-opacity: initial;
                --tw-saturate: initial;
                --tw-sepia: initial;
                --tw-drop-shadow: initial;
                --tw-drop-shadow-color: initial;
                --tw-drop-shadow-alpha: 100%;
                --tw-drop-shadow-size: initial;
              }
            }
          }
        </style>
        <link
          rel="preload"
          as="image"
          href="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/South Asian/0"
        />
        <link
          rel="preload"
          as="image"
          href="https://storage.googleapis.com/banani-avatars/avatar/female/25-35/East Asian/1"
        />
        <link
          rel="preload"
          as="image"
          href="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/European/2"
        />
        <link
          rel="preload"
          as="image"
          href="https://storage.googleapis.com/banani-avatars/avatar/female/25-35/African/3"
        />
      </head>
      <body>
        <div
          class="font-body flex bg-background"
          style="min-height: 100vh"
          data-component="@screens/TaskList.jsx"
        >
          <div
            class="bg-surface flex w-60 flex-col border-r border-border"
            style="min-height: 100vh"
            data-component="@components/Sidebar.jsx"
          >
            <div class="border-b border-border px-3 py-3">
              <div
                class="flex items-center gap-2 rounded-lg bg-secondary px-2 py-2"
              >
                <div
                  class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-primary"
                >
                  <span
                    class="font-headings text-sm font-bold text-primary-foreground"
                    >O</span
                  >
                </div>
                <div class="min-w-0 flex-1">
                  <div
                    class="text-sm leading-none font-semibold text-foreground"
                  >
                    Orbiq
                  </div>
                  <div class="mt-0.5 text-xs text-muted-foreground">
                    Veylo Workspace
                  </div>
                </div>
                <span
                  class="flex-shrink-0 text-muted-foreground"
                  style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 14px;
                  height: 14px;
                "
                  data-icon="chevrons-up-down"
                  data-component="@globalComponents/Icon.jsx"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14px"
                    height="14px"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3.4285714285714284"
                      d="m7 15l5 5l5-5M7 9l5-5l5 5"
                    ></path></svg
                ></span>
              </div>
            </div>
            <div class="px-3 pt-3 pb-2">
              <a
                class="mb-0.5 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium text-secondary-foreground"
                data-media-type="banani-button"
                ><span
                  class=""
                  style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 15px;
                  height: 15px;
                "
                  data-icon="layout-dashboard"
                  data-component="@globalComponents/Icon.jsx"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15px"
                    height="15px"
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3.2"
                    >
                      <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                      <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                      <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                      <rect width="7" height="5" x="3" y="16" rx="1"></rect>
                    </g></svg></span
                >Dashboard</a
              ><a
                class="mb-0.5 flex items-center gap-2.5 rounded-md bg-secondary px-2 py-1.5 text-sm font-medium text-foreground"
                data-media-type="banani-button"
                ><span
                  class=""
                  style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 15px;
                  height: 15px;
                "
                  data-icon="check-square"
                  data-component="@globalComponents/Icon.jsx"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15px"
                    height="15px"
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3.2"
                    >
                      <path
                        d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344"
                      ></path>
                      <path d="m9 11l3 3L22 4"></path>
                    </g></svg></span
                >My Tasks</a
              ><a
                class="mb-0.5 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium text-secondary-foreground"
                data-media-type="banani-button"
                ><span
                  class=""
                  style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 15px;
                  height: 15px;
                "
                  data-icon="inbox"
                  data-component="@globalComponents/Icon.jsx"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15px"
                    height="15px"
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3.2"
                    >
                      <path d="M22 12h-6l-2 3h-4l-2-3H2"></path>
                      <path
                        d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11"
                      ></path>
                    </g></svg></span
                >Inbox</a
              >
            </div>
            <div class="mx-3 border-t border-border"></div>
            <div class="flex-1 px-3 pt-3">
              <div class="mb-2 flex items-center justify-between px-2">
                <span
                  class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                  ><span data-file="/components/Sidebar.jsx" data-idx="0"
                    >Projects</span
                  ></span
                ><button
                  class="text-muted-foreground"
                  data-media-type="banani-button"
                >
                  <span
                    class=""
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 13px;
                    height: 13px;
                  "
                    data-icon="plus"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13px"
                      height="13px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.6923076923076925"
                        d="M5 12h14m-7-7v14"
                      ></path></svg
                  ></span>
                </button>
              </div>
              <div>
                <a
                  class="mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground"
                  data-media-type="banani-button"
                  ><span
                    class="flex-shrink-0 text-muted-foreground"
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 13px;
                    height: 13px;
                  "
                    data-icon="chevron-down"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13px"
                      height="13px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.6923076923076925"
                        d="m6 9l6 6l6-6"
                      ></path></svg
                  ></span>
                  <div
                    class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-warning"
                  >
                    <span
                      class="text-background"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 10px;
                      height: 10px;
                    "
                      data-icon="zap"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10px"
                        height="10px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4.8"
                          d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
                        ></path></svg
                    ></span>
                  </div>
                  <span class="flex-1 truncate font-medium">Veylo</span></a
                >
                <div class="mb-1 ml-5 border-l border-border pl-2">
                  <a
                    class="mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-secondary-foreground"
                    data-media-type="banani-button"
                    ><span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 14px;
                      height: 14px;
                    "
                      data-icon="layout-dashboard"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14px"
                        height="14px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.4285714285714284"
                        >
                          <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                          <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                          <rect
                            width="7"
                            height="9"
                            x="14"
                            y="12"
                            rx="1"
                          ></rect>
                          <rect width="7" height="5" x="3" y="16" rx="1"></rect>
                        </g></svg></span
                    >Overview</a
                  ><a
                    class="mb-0.5 flex items-center gap-2 rounded-md bg-secondary px-2 py-1.5 text-sm font-medium text-primary"
                    data-media-type="banani-button"
                    ><span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 14px;
                      height: 14px;
                    "
                      data-icon="check-square"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14px"
                        height="14px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.4285714285714284"
                        >
                          <path
                            d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344"
                          ></path>
                          <path d="m9 11l3 3L22 4"></path>
                        </g></svg></span
                    >Tasks</a
                  ><a
                    class="mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-secondary-foreground"
                    data-media-type="banani-button"
                    ><span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 14px;
                      height: 14px;
                    "
                      data-icon="layers"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14px"
                        height="14px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.4285714285714284"
                        >
                          <path
                            d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"
                          ></path>
                          <path
                            d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"
                          ></path>
                          <path
                            d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"
                          ></path>
                        </g></svg></span
                    >Backlog</a
                  ><a
                    class="mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-secondary-foreground"
                    data-media-type="banani-button"
                    ><span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 14px;
                      height: 14px;
                    "
                      data-icon="calendar"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14px"
                        height="14px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.4285714285714284"
                        >
                          <path d="M8 2v4m8-4v4"></path>
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                          ></rect>
                          <path d="M3 10h18"></path>
                        </g></svg></span
                    >Timeline</a
                  ><a
                    class="mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-secondary-foreground"
                    data-media-type="banani-button"
                    ><span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 14px;
                      height: 14px;
                    "
                      data-icon="bar-chart-2"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14px"
                        height="14px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.4285714285714284"
                          d="M5 21v-6m7 6V3m7 18V9"
                        ></path></svg></span
                    >Reports</a
                  >
                </div>
              </div>
              <div>
                <a
                  class="mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-secondary-foreground"
                  data-media-type="banani-button"
                  ><span
                    class="flex-shrink-0 text-muted-foreground"
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 13px;
                    height: 13px;
                  "
                    data-icon="chevron-right"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13px"
                      height="13px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.6923076923076925"
                        d="m9 18l6-6l-6-6"
                      ></path></svg
                  ></span>
                  <div
                    class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-accent"
                  >
                    <span
                      class="text-background"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 10px;
                      height: 10px;
                    "
                      data-icon="database"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10px"
                        height="10px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4.8"
                        >
                          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                          <path d="M3 5v14a9 3 0 0 0 18 0V5"></path>
                          <path d="M3 12a9 3 0 0 0 18 0"></path>
                        </g></svg
                    ></span>
                  </div>
                  <span class="flex-1 truncate font-medium">Apollo CRM</span></a
                >
              </div>
              <div>
                <a
                  class="mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-secondary-foreground"
                  data-media-type="banani-button"
                  ><span
                    class="flex-shrink-0 text-muted-foreground"
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 13px;
                    height: 13px;
                  "
                    data-icon="chevron-right"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13px"
                      height="13px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.6923076923076925"
                        d="m9 18l6-6l-6-6"
                      ></path></svg
                  ></span>
                  <div
                    class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-success"
                  >
                    <span
                      class="text-background"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 10px;
                      height: 10px;
                    "
                      data-icon="wrench"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10px"
                        height="10px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4.8"
                          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"
                        ></path></svg
                    ></span>
                  </div>
                  <span class="flex-1 truncate font-medium"
                    >Internal Tools</span
                  ></a
                >
              </div>
            </div>
            <div class="border-t border-border px-3 py-3">
              <a
                class="mb-0.5 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-secondary-foreground"
                data-media-type="banani-button"
                ><span
                  class=""
                  style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 15px;
                  height: 15px;
                "
                  data-icon="users"
                  data-component="@globalComponents/Icon.jsx"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15px"
                    height="15px"
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3.2"
                    >
                      <path
                        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87"
                      ></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </g></svg></span
                >Members</a
              ><a
                class="mb-0.5 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-secondary-foreground"
                data-media-type="banani-button"
                ><span
                  class=""
                  style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 15px;
                  height: 15px;
                "
                  data-icon="settings"
                  data-component="@globalComponents/Icon.jsx"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15px"
                    height="15px"
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3.2"
                    >
                      <path
                        d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0a2.34 2.34 0 0 0 3.319 1.915a2.34 2.34 0 0 1 2.33 4.033a2.34 2.34 0 0 0 0 3.831a2.34 2.34 0 0 1-2.33 4.033a2.34 2.34 0 0 0-3.319 1.915a2.34 2.34 0 0 1-4.659 0a2.34 2.34 0 0 0-3.32-1.915a2.34 2.34 0 0 1-2.33-4.033a2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
                      ></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </g></svg></span
                >Settings</a
              ><a
                class="mb-0.5 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-secondary-foreground"
                data-media-type="banani-button"
                ><span
                  class=""
                  style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 15px;
                  height: 15px;
                "
                  data-icon="help-circle"
                  data-component="@globalComponents/Icon.jsx"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15px"
                    height="15px"
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3.2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path
                        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01"
                      ></path>
                    </g></svg></span
                >Help</a
              >
              <div class="mt-1 flex items-center gap-2.5 px-2 py-2">
                <img
                  src="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/South Asian/0"
                  class="h-7 w-7 rounded-full"
                  data-component="@globalComponents/UserAvatar.jsx"
                />
                <div class="min-w-0 flex-1">
                  <div
                    class="truncate text-sm leading-none font-medium text-foreground"
                  >
                    Arjun Mehta
                  </div>
                  <div class="mt-0.5 text-xs text-muted-foreground">Admin</div>
                </div>
                <span
                  class="text-muted-foreground"
                  style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 14px;
                  height: 14px;
                "
                  data-icon="more-horizontal"
                  data-component="@globalComponents/Icon.jsx"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14px"
                    height="14px"
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3.4285714285714284"
                    >
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                    </g></svg
                ></span>
              </div>
            </div>
          </div>
          <div class="flex min-w-0 flex-1 flex-col">
            <div
              class="bg-surface flex h-12 items-center gap-3 border-b border-border px-4"
              data-component="@components/TopBar.jsx"
            >
              <button
                class="rounded-md p-1.5 text-muted-foreground"
                data-media-type="banani-button"
              >
                <span
                  class=""
                  style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 16px;
                  height: 16px;
                "
                  data-icon="panel-left"
                  data-component="@globalComponents/Icon.jsx"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16px"
                    height="16px"
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                      <path d="M9 3v18"></path>
                    </g></svg
                ></span>
              </button>
              <div class="h-5 w-px bg-border"></div>
              <div
                class="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <span
                  class=""
                  style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 14px;
                  height: 14px;
                "
                  data-icon="folder"
                  data-component="@globalComponents/Icon.jsx"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14px"
                    height="14px"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3.4285714285714284"
                      d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
                    ></path></svg></span
                ><span
                  ><span data-file="/components/TopBar.jsx" data-idx="0"
                    >Projects</span
                  ></span
                >
              </div>
              <div class="flex flex-1 justify-center">
                <div
                  class="flex w-72 items-center gap-2 rounded-md border border-border bg-input px-3 py-1.5"
                >
                  <span
                    class="text-muted-foreground"
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 14px;
                    height: 14px;
                  "
                    data-icon="search"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14px"
                      height="14px"
                      viewBox="0 0 24 24"
                    >
                      <g
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.4285714285714284"
                      >
                        <path d="m21 21l-4.34-4.34"></path>
                        <circle cx="11" cy="11" r="8"></circle>
                      </g></svg></span
                  ><span class="flex-1 text-sm text-muted-foreground"
                    ><span data-file="/components/TopBar.jsx" data-idx="1"
                      >Search...</span
                    ></span
                  >
                  <div class="flex items-center gap-0.5 text-muted-foreground">
                    <kbd class="rounded bg-muted px-1 text-xs">⌘</kbd
                    ><kbd class="rounded bg-muted px-1 text-xs">K</kbd>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="rounded-md p-1.5 text-muted-foreground"
                  data-media-type="banani-button"
                >
                  <span
                    class=""
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 16px;
                    height: 16px;
                  "
                    data-icon="bell"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16px"
                      height="16px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M10.268 21a2 2 0 0 0 3.464 0m-10.47-5.674A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
                      ></path></svg
                  ></span></button
                ><img
                  src="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/South Asian/0"
                  class="h-7 w-7 rounded-full"
                  data-component="@globalComponents/UserAvatar.jsx"
                />
              </div>
            </div>
            <div
              class="bg-surface border-b border-border"
              data-component="@components/ProjectHeader.jsx"
            >
              <div class="px-6 pt-5 pb-4">
                <div
                  class="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <button
                    class="rounded p-1 text-muted-foreground"
                    data-media-type="banani-button"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="arrow-left"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                          d="m12 19l-7-7l7-7m7 7H5"
                        ></path></svg
                    ></span></button
                  ><a
                    class="text-muted-foreground"
                    data-media-type="banani-button"
                    ><span
                      data-file="/components/ProjectHeader.jsx"
                      data-idx="11"
                      >Projects</span
                    ></a
                  ><span
                    class=""
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 12px;
                    height: 12px;
                  "
                    data-icon="chevron-right"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12px"
                      height="12px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="4"
                        d="m9 18l6-6l-6-6"
                      ></path></svg></span
                  ><span class="text-secondary-foreground"
                    ><span
                      data-file="/components/ProjectHeader.jsx"
                      data-idx="12"
                      >Veylo</span
                    ></span
                  >
                </div>
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-warning"
                    >
                      <span
                        class="text-background"
                        style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        width: 18px;
                        height: 18px;
                      "
                        data-icon="zap"
                        data-component="@globalComponents/Icon.jsx"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18px"
                          height="18px"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.6666666666666665"
                            d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
                          ></path></svg
                      ></span>
                    </div>
                    <div>
                      <div class="flex items-center gap-2.5">
                        <h1
                          class="font-headings text-2xl leading-none font-semibold text-foreground"
                        >
                          <span
                            data-file="/components/ProjectHeader.jsx"
                            data-idx="13"
                            >Veylo</span
                          >
                        </h1>
                        <span
                          class="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                          ><span
                            data-file="/components/ProjectHeader.jsx"
                            data-idx="14"
                            >Scrum</span
                          ></span
                        >
                        <div class="flex items-center gap-1.5">
                          <div class="h-2 w-2 rounded-full bg-success"></div>
                          <span class="text-xs font-medium text-success"
                            ><span
                              data-file="/components/ProjectHeader.jsx"
                              data-idx="15"
                              >On Track</span
                            ></span
                          >
                        </div>
                      </div>
                      <div class="mt-1.5 flex items-center gap-4">
                        <div
                          class="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <span
                            class=""
                            style="
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            flex-shrink: 0;
                            width: 12px;
                            height: 12px;
                          "
                            data-icon="repeat"
                            data-component="@globalComponents/Icon.jsx"
                            ><svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12px"
                              height="12px"
                              viewBox="0 0 24 24"
                            >
                              <g
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="4"
                              >
                                <path d="m17 2l4 4l-4 4"></path>
                                <path
                                  d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4l4-4"
                                ></path>
                                <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                              </g></svg></span
                          ><span
                            ><span
                              data-file="/components/ProjectHeader.jsx"
                              data-idx="16"
                              >Sprint 4</span
                            ></span
                          ><span class="text-border">·</span
                          ><span
                            ><span
                              data-file="/components/ProjectHeader.jsx"
                              data-idx="17"
                              >Jul 8 – Jul 22, 2026</span
                            ></span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-5">
                    <div class="text-right">
                      <div class="mb-1 flex items-center justify-end gap-2">
                        <span class="text-xs text-muted-foreground"
                          ><span
                            data-file="/components/ProjectHeader.jsx"
                            data-idx="18"
                            >Sprint Progress</span
                          ></span
                        ><span class="text-xs font-semibold text-foreground"
                          >67%</span
                        >
                      </div>
                      <div
                        class="h-1.5 w-36 overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          class="h-full rounded-full bg-primary"
                          style="width: 67%"
                        ></div>
                      </div>
                      <div class="mt-1 text-xs text-muted-foreground">
                        8
                        <span
                          data-file="/components/ProjectHeader.jsx"
                          data-idx="19"
                          >of</span
                        >
                        12
                        <span
                          data-file="/components/ProjectHeader.jsx"
                          data-idx="20"
                          >tasks done</span
                        >
                      </div>
                    </div>
                    <div class="flex items-center">
                      <div
                        class="border-surface -ml-2 rounded-full border-2 first:ml-0"
                      >
                        <img
                          src="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/South Asian/0"
                          class="h-7 w-7 rounded-full"
                          data-component="@globalComponents/UserAvatar.jsx"
                        />
                      </div>
                      <div
                        class="border-surface -ml-2 rounded-full border-2 first:ml-0"
                      >
                        <img
                          src="https://storage.googleapis.com/banani-avatars/avatar/female/25-35/East Asian/1"
                          class="h-7 w-7 rounded-full"
                          data-component="@globalComponents/UserAvatar.jsx"
                        />
                      </div>
                      <div
                        class="border-surface -ml-2 rounded-full border-2 first:ml-0"
                      >
                        <img
                          src="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/European/2"
                          class="h-7 w-7 rounded-full"
                          data-component="@globalComponents/UserAvatar.jsx"
                        />
                      </div>
                      <div
                        class="border-surface -ml-2 rounded-full border-2 first:ml-0"
                      >
                        <img
                          src="https://storage.googleapis.com/banani-avatars/avatar/female/25-35/African/3"
                          class="h-7 w-7 rounded-full"
                          data-component="@globalComponents/UserAvatar.jsx"
                        />
                      </div>
                      <div
                        class="border-surface -ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-secondary text-xs font-medium text-muted-foreground"
                      >
                        +3
                      </div>
                    </div>
                    <button
                      class="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      data-media-type="banani-button"
                    >
                      <span
                        class=""
                        style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        width: 15px;
                        height: 15px;
                      "
                        data-icon="plus"
                        data-component="@globalComponents/Icon.jsx"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15px"
                          height="15px"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3.2"
                            d="M5 12h14m-7-7v14"
                          ></path></svg></span
                      ><span
                        data-file="/components/ProjectHeader.jsx"
                        data-idx="21"
                        >New Task</span
                      >
                    </button>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-0.5 px-6">
                <a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="0"
                    >Overview</span
                  ></a
                ><a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="1"
                    >List</span
                  ></a
                ><a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="2"
                    >Board</span
                  ></a
                ><a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="3"
                    >Backlog</span
                  ></a
                ><a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="4"
                    >Timeline</span
                  ></a
                ><a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="5"
                    >Epics</span
                  ></a
                ><a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="6"
                    >Workload</span
                  ></a
                ><a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="7"
                    >Reports</span
                  ></a
                ><a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="8"
                    >Files</span
                  ></a
                ><a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="9"
                    >Docs</span
                  ></a
                ><a
                  class="mb-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                  data-media-type="banani-button"
                  ><span data-file="/components/ProjectHeader.jsx" data-idx="10"
                    >Settings</span
                  ></a
                >
              </div>
            </div>
            <div
              class="bg-surface flex items-center gap-2 border-b border-border px-4 py-2.5"
              data-component="@components/TaskListToolbar.jsx"
            >
              <div class="flex flex-1 items-center gap-2">
                <button
                  class="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm text-secondary-foreground"
                  data-media-type="banani-button"
                >
                  <span
                    class=""
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 13px;
                    height: 13px;
                  "
                    data-icon="filter"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13px"
                      height="13px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.6923076923076925"
                        d="M22 3H2l8 9.46V19l4 2v-8.54z"
                      ></path></svg></span
                  ><span
                    data-file="/components/TaskListToolbar.jsx"
                    data-idx="0"
                    >Filter</span
                  ></button
                ><button
                  class="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm text-secondary-foreground"
                  data-media-type="banani-button"
                >
                  <span
                    class=""
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 13px;
                    height: 13px;
                  "
                    data-icon="group"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13px"
                      height="13px"
                      viewBox="0 0 24 24"
                    >
                      <g
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.6923076923076925"
                      >
                        <path
                          d="M3 7V5c0-1.1.9-2 2-2h2m10 0h2c1.1 0 2 .9 2 2v2m0 10v2c0 1.1-.9 2-2 2h-2M7 21H5c-1.1 0-2-.9-2-2v-2"
                        ></path>
                        <rect width="7" height="5" x="7" y="7" rx="1"></rect>
                        <rect width="7" height="5" x="10" y="12" rx="1"></rect>
                      </g></svg></span
                  ><span
                    data-file="/components/TaskListToolbar.jsx"
                    data-idx="1"
                    >Group</span
                  ></button
                ><button
                  class="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm text-secondary-foreground"
                  data-media-type="banani-button"
                >
                  <span
                    class=""
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 13px;
                    height: 13px;
                  "
                    data-icon="arrow-up-down"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13px"
                      height="13px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.6923076923076925"
                        d="m21 16l-4 4l-4-4m4 4V4M3 8l4-4l4 4M7 4v16"
                      ></path></svg></span
                  ><span
                    data-file="/components/TaskListToolbar.jsx"
                    data-idx="2"
                    >Sort</span
                  >
                </button>
                <div class="mx-1 h-5 w-px bg-border"></div>
                <div
                  class="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-sm text-secondary-foreground"
                >
                  <span class="text-xs text-muted-foreground"
                    ><span
                      data-file="/components/TaskListToolbar.jsx"
                      data-idx="3"
                      >Assignee:</span
                    ></span
                  ><span
                    ><span
                      data-file="/components/TaskListToolbar.jsx"
                      data-idx="4"
                      >Me</span
                    ></span
                  ><button data-media-type="banani-button">
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 12px;
                      height: 12px;
                    "
                      data-icon="x"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12px"
                        height="12px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4"
                          d="M18 6L6 18M6 6l12 12"
                        ></path></svg
                    ></span>
                  </button>
                </div>
                <div
                  class="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-sm text-secondary-foreground"
                >
                  <span class="text-xs text-muted-foreground"
                    ><span
                      data-file="/components/TaskListToolbar.jsx"
                      data-idx="5"
                      >Sprint:</span
                    ></span
                  ><span
                    ><span
                      data-file="/components/TaskListToolbar.jsx"
                      data-idx="6"
                      >Current</span
                    ></span
                  ><button data-media-type="banani-button">
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 12px;
                      height: 12px;
                    "
                      data-icon="x"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12px"
                        height="12px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4"
                          d="M18 6L6 18M6 6l12 12"
                        ></path></svg
                    ></span>
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-1 rounded-md bg-muted p-0.5">
                <button
                  class="bg-surface rounded p-1.5 text-foreground"
                  data-media-type="banani-button"
                >
                  <span
                    class=""
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 15px;
                    height: 15px;
                  "
                    data-icon="list"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15px"
                      height="15px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.2"
                        d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"
                      ></path></svg
                  ></span></button
                ><button
                  class="rounded p-1.5 text-muted-foreground"
                  data-media-type="banani-button"
                >
                  <span
                    class=""
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 15px;
                    height: 15px;
                  "
                    data-icon="kanban"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15px"
                      height="15px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.2"
                        d="M5 3v14m7-14v8m7-8v18"
                      ></path></svg
                  ></span></button
                ><button
                  class="rounded p-1.5 text-muted-foreground"
                  data-media-type="banani-button"
                >
                  <span
                    class=""
                    style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 15px;
                    height: 15px;
                  "
                    data-icon="calendar-days"
                    data-component="@globalComponents/Icon.jsx"
                    ><svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15px"
                      height="15px"
                      viewBox="0 0 24 24"
                    >
                      <g
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3.2"
                      >
                        <path d="M8 2v4m8-4v4"></path>
                        <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                        <path
                          d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"
                        ></path>
                      </g></svg
                  ></span>
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-visible">
              <div
                class="bg-surface flex items-center gap-0 border-b border-border text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                style="min-height: 36px"
                data-component="@components/TaskTableHeader.jsx"
              >
                <div class="w-10 flex-shrink-0"></div>
                <div class="w-20 flex-shrink-0">
                  <span data-file="/components/TaskTableHeader.jsx" data-idx="0"
                    >ID</span
                  >
                </div>
                <div class="flex-1 pr-4">
                  <span data-file="/components/TaskTableHeader.jsx" data-idx="1"
                    >Title</span
                  >
                </div>
                <div class="w-32 flex-shrink-0">
                  <span data-file="/components/TaskTableHeader.jsx" data-idx="2"
                    >Status</span
                  >
                </div>
                <div class="w-28 flex-shrink-0">
                  <span data-file="/components/TaskTableHeader.jsx" data-idx="3"
                    >Priority</span
                  >
                </div>
                <div class="w-32 flex-shrink-0">
                  <span data-file="/components/TaskTableHeader.jsx" data-idx="4"
                    >Progress</span
                  >
                </div>
                <div class="w-28 flex-shrink-0">
                  <span data-file="/components/TaskTableHeader.jsx" data-idx="5"
                    >Assignee</span
                  >
                </div>
                <div class="w-24 flex-shrink-0">
                  <span data-file="/components/TaskTableHeader.jsx" data-idx="6"
                    >Due Date</span
                  >
                </div>
                <div class="w-10 flex-shrink-0"></div>
              </div>
              <div class="mb-2" data-component="@components/TaskGroup.jsx">
                <div
                  class="bg-surface flex items-center gap-2 border-b border-border px-3 py-2"
                >
                  <button
                    class="text-muted-foreground"
                    data-media-type="banani-button"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 14px;
                      height: 14px;
                    "
                      data-icon="chevron-down"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14px"
                        height="14px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.4285714285714284"
                          d="m6 9l6 6l6-6"
                        ></path></svg
                    ></span></button
                  ><span class="text-sm font-semibold text-foreground"
                    ><span data-file="/screens/TaskList.jsx" data-idx="0"
                      >Sprint 4 · Jul 8 – Jul 22</span
                    ></span
                  ><span
                    class="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                    >5</span
                  >
                  <div class="flex-1"></div>
                  <button
                    class="flex items-center gap-1 text-xs text-muted-foreground"
                    data-media-type="banani-button"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="plus"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                          d="M5 12h14m-7-7v14"
                        ></path></svg></span
                    ><span data-file="/components/TaskGroup.jsx" data-idx="0"
                      >Add task</span
                    >
                  </button>
                </div>
                <div
                  class="group flex items-center gap-0 border-b border-border bg-background text-sm"
                  style="min-height: 44px"
                  data-component="@components/TaskRow.jsx"
                >
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <div
                      class="h-4 w-4 flex-shrink-0 rounded border border-border bg-input"
                    ></div>
                  </div>
                  <div
                    class="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground"
                  >
                    VLO-48
                  </div>
                  <div class="flex min-w-0 flex-1 items-center gap-2 pr-4">
                    <span class="truncate font-medium text-foreground"
                      >Redesign onboarding flow for new enterprise users</span
                    >
                    <div class="flex flex-shrink-0 items-center gap-1">
                      <span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >Design</span
                      ><span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >UX</span
                      >
                    </div>
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-1.5">
                    <div
                      class="h-2 w-2 flex-shrink-0 rounded-full bg-primary"
                    ></div>
                    <span class="text-xs font-medium text-primary"
                      >In Progress</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-1.5">
                    <span
                      class="text-warning"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="arrow-up"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                          d="m5 12l7-7l7 7m-7 7V5"
                        ></path></svg></span
                    ><span class="text-xs font-medium text-warning">High</span>
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-2">
                    <div
                      class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        class="h-full rounded-full bg-primary"
                        style="width: 65%"
                      ></div>
                    </div>
                    <span class="w-8 text-right text-xs text-muted-foreground"
                      >65<!-- -->%</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-2">
                    <img
                      src="https://storage.googleapis.com/banani-avatars/avatar/female/25-35/East Asian/1"
                      class="h-6 w-6 rounded-full"
                      data-component="@globalComponents/UserAvatar.jsx"
                    /><span class="truncate text-xs text-secondary-foreground"
                      >Yuna Kim</span
                    >
                  </div>
                  <div
                    class="flex w-24 flex-shrink-0 items-center gap-1 text-secondary-foreground"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 12px;
                      height: 12px;
                    "
                      data-icon="calendar"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12px"
                        height="12px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4"
                        >
                          <path d="M8 2v4m8-4v4"></path>
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                          ></rect>
                          <path d="M3 10h18"></path>
                        </g></svg></span
                    ><span class="text-xs">Jul 18</span>
                  </div>
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <button
                      class="rounded p-1 text-muted-foreground"
                      data-media-type="banani-button"
                    >
                      <span
                        class=""
                        style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        width: 15px;
                        height: 15px;
                      "
                        data-icon="more-horizontal"
                        data-component="@globalComponents/Icon.jsx"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15px"
                          height="15px"
                          viewBox="0 0 24 24"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3.2"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </g></svg
                      ></span>
                    </button>
                  </div>
                </div>
                <div
                  class="group flex items-center gap-0 border-b border-border bg-background text-sm"
                  style="min-height: 44px"
                  data-component="@components/TaskRow.jsx"
                >
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <div
                      class="h-4 w-4 flex-shrink-0 rounded border border-border bg-input"
                    ></div>
                  </div>
                  <div
                    class="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground"
                  >
                    VLO-47
                  </div>
                  <div class="flex min-w-0 flex-1 items-center gap-2 pr-4">
                    <span class="truncate font-medium text-foreground"
                      >Fix authentication token expiry bug on mobile</span
                    >
                    <div class="flex flex-shrink-0 items-center gap-1">
                      <span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >Bug</span
                      ><span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >Auth</span
                      >
                    </div>
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-1.5">
                    <div
                      class="h-2 w-2 flex-shrink-0 rounded-full bg-warning"
                    ></div>
                    <span class="text-xs font-medium text-warning"
                      >In Review</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-1.5">
                    <span
                      class="text-danger"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="alert-circle"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 8v4m0 4h.01"></path>
                        </g></svg></span
                    ><span class="text-danger text-xs font-medium"
                      >Critical</span
                    >
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-2">
                    <div
                      class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        class="h-full rounded-full bg-primary"
                        style="width: 90%"
                      ></div>
                    </div>
                    <span class="w-8 text-right text-xs text-muted-foreground"
                      >90<!-- -->%</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-2">
                    <img
                      src="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/South Asian/0"
                      class="h-6 w-6 rounded-full"
                      data-component="@globalComponents/UserAvatar.jsx"
                    /><span class="truncate text-xs text-secondary-foreground"
                      >Arjun Mehta</span
                    >
                  </div>
                  <div
                    class="flex w-24 flex-shrink-0 items-center gap-1 text-secondary-foreground"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 12px;
                      height: 12px;
                    "
                      data-icon="calendar"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12px"
                        height="12px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4"
                        >
                          <path d="M8 2v4m8-4v4"></path>
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                          ></rect>
                          <path d="M3 10h18"></path>
                        </g></svg></span
                    ><span class="text-xs">Jul 16</span>
                  </div>
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <button
                      class="rounded p-1 text-muted-foreground"
                      data-media-type="banani-button"
                    >
                      <span
                        class=""
                        style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        width: 15px;
                        height: 15px;
                      "
                        data-icon="more-horizontal"
                        data-component="@globalComponents/Icon.jsx"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15px"
                          height="15px"
                          viewBox="0 0 24 24"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3.2"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </g></svg
                      ></span>
                    </button>
                  </div>
                </div>
                <div
                  class="group flex items-center gap-0 border-b border-border bg-background text-sm"
                  style="min-height: 44px"
                  data-component="@components/TaskRow.jsx"
                >
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <div
                      class="h-4 w-4 flex-shrink-0 rounded border border-border bg-input"
                    ></div>
                  </div>
                  <div
                    class="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground"
                  >
                    VLO-46
                  </div>
                  <div class="flex min-w-0 flex-1 items-center gap-2 pr-4">
                    <span class="truncate font-medium text-foreground"
                      >Set up CI/CD pipeline for staging environment</span
                    >
                    <div class="flex flex-shrink-0 items-center gap-1">
                      <span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >DevOps</span
                      >
                    </div>
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-1.5">
                    <div
                      class="h-2 w-2 flex-shrink-0 rounded-full bg-success"
                    ></div>
                    <span class="text-xs font-medium text-success">Done</span>
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-1.5">
                    <span
                      class="text-primary"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="minus"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                          d="M5 12h14"
                        ></path></svg></span
                    ><span class="text-xs font-medium text-primary"
                      >Medium</span
                    >
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-2">
                    <div
                      class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        class="h-full rounded-full bg-primary"
                        style="width: 100%"
                      ></div>
                    </div>
                    <span class="w-8 text-right text-xs text-muted-foreground"
                      >100<!-- -->%</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-2">
                    <img
                      src="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/European/2"
                      class="h-6 w-6 rounded-full"
                      data-component="@globalComponents/UserAvatar.jsx"
                    /><span class="truncate text-xs text-secondary-foreground"
                      >Luca Ferrara</span
                    >
                  </div>
                  <div
                    class="flex w-24 flex-shrink-0 items-center gap-1 text-secondary-foreground"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 12px;
                      height: 12px;
                    "
                      data-icon="calendar"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12px"
                        height="12px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4"
                        >
                          <path d="M8 2v4m8-4v4"></path>
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                          ></rect>
                          <path d="M3 10h18"></path>
                        </g></svg></span
                    ><span class="text-xs">Jul 14</span>
                  </div>
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <button
                      class="rounded p-1 text-muted-foreground"
                      data-media-type="banani-button"
                    >
                      <span
                        class=""
                        style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        width: 15px;
                        height: 15px;
                      "
                        data-icon="more-horizontal"
                        data-component="@globalComponents/Icon.jsx"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15px"
                          height="15px"
                          viewBox="0 0 24 24"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3.2"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </g></svg
                      ></span>
                    </button>
                  </div>
                </div>
                <div
                  class="group flex items-center gap-0 border-b border-border bg-background text-sm"
                  style="min-height: 44px"
                  data-component="@components/TaskRow.jsx"
                >
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <div
                      class="h-4 w-4 flex-shrink-0 rounded border border-border bg-input"
                    ></div>
                  </div>
                  <div
                    class="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground"
                  >
                    VLO-45
                  </div>
                  <div class="flex min-w-0 flex-1 items-center gap-2 pr-4">
                    <span class="truncate font-medium text-foreground"
                      >Implement CSV export for analytics reports</span
                    >
                    <div class="flex flex-shrink-0 items-center gap-1">
                      <span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >Analytics</span
                      >
                    </div>
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-1.5">
                    <div
                      class="h-2 w-2 flex-shrink-0 rounded-full bg-muted-foreground"
                    ></div>
                    <span class="text-xs font-medium text-muted-foreground"
                      >Todo</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-1.5">
                    <span
                      class="text-primary"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="minus"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                          d="M5 12h14"
                        ></path></svg></span
                    ><span class="text-xs font-medium text-primary"
                      >Medium</span
                    >
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-2">
                    <div
                      class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        class="h-full rounded-full bg-primary"
                        style="width: 0%"
                      ></div>
                    </div>
                    <span class="w-8 text-right text-xs text-muted-foreground"
                      >0<!-- -->%</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-2">
                    <img
                      src="https://storage.googleapis.com/banani-avatars/avatar/female/25-35/African/3"
                      class="h-6 w-6 rounded-full"
                      data-component="@globalComponents/UserAvatar.jsx"
                    /><span class="truncate text-xs text-secondary-foreground"
                      >Amara Diallo</span
                    >
                  </div>
                  <div
                    class="flex w-24 flex-shrink-0 items-center gap-1 text-secondary-foreground"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 12px;
                      height: 12px;
                    "
                      data-icon="calendar"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12px"
                        height="12px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4"
                        >
                          <path d="M8 2v4m8-4v4"></path>
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                          ></rect>
                          <path d="M3 10h18"></path>
                        </g></svg></span
                    ><span class="text-xs">Jul 22</span>
                  </div>
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <button
                      class="rounded p-1 text-muted-foreground"
                      data-media-type="banani-button"
                    >
                      <span
                        class=""
                        style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        width: 15px;
                        height: 15px;
                      "
                        data-icon="more-horizontal"
                        data-component="@globalComponents/Icon.jsx"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15px"
                          height="15px"
                          viewBox="0 0 24 24"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3.2"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </g></svg
                      ></span>
                    </button>
                  </div>
                </div>
                <div
                  class="group flex items-center gap-0 border-b border-border bg-background text-sm"
                  style="min-height: 44px"
                  data-component="@components/TaskRow.jsx"
                >
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <div
                      class="h-4 w-4 flex-shrink-0 rounded border border-border bg-input"
                    ></div>
                  </div>
                  <div
                    class="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground"
                  >
                    VLO-44
                  </div>
                  <div class="flex min-w-0 flex-1 items-center gap-2 pr-4">
                    <span class="truncate font-medium text-foreground"
                      >Write API docs for v2 endpoints</span
                    >
                    <div class="flex flex-shrink-0 items-center gap-1">
                      <span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >Docs</span
                      >
                    </div>
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-1.5">
                    <div
                      class="h-2 w-2 flex-shrink-0 rounded-full bg-primary"
                    ></div>
                    <span class="text-xs font-medium text-primary"
                      >In Progress</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-1.5">
                    <span
                      class="text-muted-foreground"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="arrow-down"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                          d="M12 5v14m7-7l-7 7l-7-7"
                        ></path></svg></span
                    ><span class="text-xs font-medium text-muted-foreground"
                      >Low</span
                    >
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-2">
                    <div
                      class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        class="h-full rounded-full bg-primary"
                        style="width: 40%"
                      ></div>
                    </div>
                    <span class="w-8 text-right text-xs text-muted-foreground"
                      >40<!-- -->%</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-2">
                    <img
                      src="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/European/2"
                      class="h-6 w-6 rounded-full"
                      data-component="@globalComponents/UserAvatar.jsx"
                    /><span class="truncate text-xs text-secondary-foreground"
                      >Luca Ferrara</span
                    >
                  </div>
                  <div
                    class="flex w-24 flex-shrink-0 items-center gap-1 text-secondary-foreground"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 12px;
                      height: 12px;
                    "
                      data-icon="calendar"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12px"
                        height="12px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4"
                        >
                          <path d="M8 2v4m8-4v4"></path>
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                          ></rect>
                          <path d="M3 10h18"></path>
                        </g></svg></span
                    ><span class="text-xs">Jul 20</span>
                  </div>
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <button
                      class="rounded p-1 text-muted-foreground"
                      data-media-type="banani-button"
                    >
                      <span
                        class=""
                        style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        width: 15px;
                        height: 15px;
                      "
                        data-icon="more-horizontal"
                        data-component="@globalComponents/Icon.jsx"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15px"
                          height="15px"
                          viewBox="0 0 24 24"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3.2"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </g></svg
                      ></span>
                    </button>
                  </div>
                </div>
              </div>
              <div class="mb-2" data-component="@components/TaskGroup.jsx">
                <div
                  class="bg-surface flex items-center gap-2 border-b border-border px-3 py-2"
                >
                  <button
                    class="text-muted-foreground"
                    data-media-type="banani-button"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 14px;
                      height: 14px;
                    "
                      data-icon="chevron-down"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14px"
                        height="14px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.4285714285714284"
                          d="m6 9l6 6l6-6"
                        ></path></svg
                    ></span></button
                  ><span class="text-sm font-semibold text-foreground"
                    ><span data-file="/screens/TaskList.jsx" data-idx="1"
                      >Backlog</span
                    ></span
                  ><span
                    class="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                    >3</span
                  >
                  <div class="flex-1"></div>
                  <button
                    class="flex items-center gap-1 text-xs text-muted-foreground"
                    data-media-type="banani-button"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="plus"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                          d="M5 12h14m-7-7v14"
                        ></path></svg></span
                    ><span data-file="/components/TaskGroup.jsx" data-idx="0"
                      >Add task</span
                    >
                  </button>
                </div>
                <div
                  class="group flex items-center gap-0 border-b border-border bg-background text-sm"
                  style="min-height: 44px"
                  data-component="@components/TaskRow.jsx"
                >
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <div
                      class="h-4 w-4 flex-shrink-0 rounded border border-border bg-input"
                    ></div>
                  </div>
                  <div
                    class="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground"
                  >
                    VLO-43
                  </div>
                  <div class="flex min-w-0 flex-1 items-center gap-2 pr-4">
                    <span class="truncate font-medium text-foreground"
                      >Add SSO support for Google Workspace</span
                    >
                    <div class="flex flex-shrink-0 items-center gap-1">
                      <span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >Auth</span
                      ><span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >Enterprise</span
                      >
                    </div>
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-1.5">
                    <div
                      class="h-2 w-2 flex-shrink-0 rounded-full bg-muted-foreground"
                    ></div>
                    <span class="text-xs font-medium text-muted-foreground"
                      >Todo</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-1.5">
                    <span
                      class="text-warning"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="arrow-up"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                          d="m5 12l7-7l7 7m-7 7V5"
                        ></path></svg></span
                    ><span class="text-xs font-medium text-warning">High</span>
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-2">
                    <div
                      class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        class="h-full rounded-full bg-primary"
                        style="width: 0%"
                      ></div>
                    </div>
                    <span class="w-8 text-right text-xs text-muted-foreground"
                      >0<!-- -->%</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-2">
                    <img
                      src="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/South Asian/0"
                      class="h-6 w-6 rounded-full"
                      data-component="@globalComponents/UserAvatar.jsx"
                    /><span class="truncate text-xs text-secondary-foreground"
                      >Arjun Mehta</span
                    >
                  </div>
                  <div
                    class="flex w-24 flex-shrink-0 items-center gap-1 text-secondary-foreground"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 12px;
                      height: 12px;
                    "
                      data-icon="calendar"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12px"
                        height="12px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4"
                        >
                          <path d="M8 2v4m8-4v4"></path>
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                          ></rect>
                          <path d="M3 10h18"></path>
                        </g></svg></span
                    ><span class="text-xs">Aug 5</span>
                  </div>
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <button
                      class="rounded p-1 text-muted-foreground"
                      data-media-type="banani-button"
                    >
                      <span
                        class=""
                        style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        width: 15px;
                        height: 15px;
                      "
                        data-icon="more-horizontal"
                        data-component="@globalComponents/Icon.jsx"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15px"
                          height="15px"
                          viewBox="0 0 24 24"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3.2"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </g></svg
                      ></span>
                    </button>
                  </div>
                </div>
                <div
                  class="group flex items-center gap-0 border-b border-border bg-background text-sm"
                  style="min-height: 44px"
                  data-component="@components/TaskRow.jsx"
                >
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <div
                      class="h-4 w-4 flex-shrink-0 rounded border border-border bg-input"
                    ></div>
                  </div>
                  <div
                    class="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground"
                  >
                    VLO-42
                  </div>
                  <div class="flex min-w-0 flex-1 items-center gap-2 pr-4">
                    <span class="truncate font-medium text-foreground"
                      >Dark mode polish — fix icon contrast issues</span
                    >
                    <div class="flex flex-shrink-0 items-center gap-1">
                      <span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >Design</span
                      >
                    </div>
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-1.5">
                    <div
                      class="h-2 w-2 flex-shrink-0 rounded-full bg-muted-foreground"
                    ></div>
                    <span class="text-xs font-medium text-muted-foreground"
                      >Todo</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-1.5">
                    <span
                      class="text-muted-foreground"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="arrow-down"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                          d="M12 5v14m7-7l-7 7l-7-7"
                        ></path></svg></span
                    ><span class="text-xs font-medium text-muted-foreground"
                      >Low</span
                    >
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-2">
                    <div
                      class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        class="h-full rounded-full bg-primary"
                        style="width: 0%"
                      ></div>
                    </div>
                    <span class="w-8 text-right text-xs text-muted-foreground"
                      >0<!-- -->%</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-2">
                    <img
                      src="https://storage.googleapis.com/banani-avatars/avatar/female/25-35/East Asian/1"
                      class="h-6 w-6 rounded-full"
                      data-component="@globalComponents/UserAvatar.jsx"
                    /><span class="truncate text-xs text-secondary-foreground"
                      >Yuna Kim</span
                    >
                  </div>
                  <div
                    class="flex w-24 flex-shrink-0 items-center gap-1 text-secondary-foreground"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 12px;
                      height: 12px;
                    "
                      data-icon="calendar"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12px"
                        height="12px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4"
                        >
                          <path d="M8 2v4m8-4v4"></path>
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                          ></rect>
                          <path d="M3 10h18"></path>
                        </g></svg></span
                    ><span class="text-xs">Aug 10</span>
                  </div>
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <button
                      class="rounded p-1 text-muted-foreground"
                      data-media-type="banani-button"
                    >
                      <span
                        class=""
                        style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        width: 15px;
                        height: 15px;
                      "
                        data-icon="more-horizontal"
                        data-component="@globalComponents/Icon.jsx"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15px"
                          height="15px"
                          viewBox="0 0 24 24"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3.2"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </g></svg
                      ></span>
                    </button>
                  </div>
                </div>
                <div
                  class="group flex items-center gap-0 border-b border-border bg-background text-sm"
                  style="min-height: 44px"
                  data-component="@components/TaskRow.jsx"
                >
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <div
                      class="h-4 w-4 flex-shrink-0 rounded border border-border bg-input"
                    ></div>
                  </div>
                  <div
                    class="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground"
                  >
                    VLO-41
                  </div>
                  <div class="flex min-w-0 flex-1 items-center gap-2 pr-4">
                    <span class="truncate font-medium text-foreground"
                      >Localization: add Japanese language support</span
                    >
                    <div class="flex flex-shrink-0 items-center gap-1">
                      <span
                        class="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >i18n</span
                      >
                    </div>
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-1.5">
                    <div
                      class="bg-danger h-2 w-2 flex-shrink-0 rounded-full"
                    ></div>
                    <span class="text-danger text-xs font-medium">Blocked</span>
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-1.5">
                    <span
                      class="text-primary"
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 13px;
                      height: 13px;
                    "
                      data-icon="minus"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13px"
                        height="13px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3.6923076923076925"
                          d="M5 12h14"
                        ></path></svg></span
                    ><span class="text-xs font-medium text-primary"
                      >Medium</span
                    >
                  </div>
                  <div class="flex w-32 flex-shrink-0 items-center gap-2">
                    <div
                      class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        class="h-full rounded-full bg-primary"
                        style="width: 15%"
                      ></div>
                    </div>
                    <span class="w-8 text-right text-xs text-muted-foreground"
                      >15<!-- -->%</span
                    >
                  </div>
                  <div class="flex w-28 flex-shrink-0 items-center gap-2">
                    <img
                      src="https://storage.googleapis.com/banani-avatars/avatar/female/25-35/African/3"
                      class="h-6 w-6 rounded-full"
                      data-component="@globalComponents/UserAvatar.jsx"
                    /><span class="truncate text-xs text-secondary-foreground"
                      >Amara Diallo</span
                    >
                  </div>
                  <div
                    class="flex w-24 flex-shrink-0 items-center gap-1 text-secondary-foreground"
                  >
                    <span
                      class=""
                      style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      width: 12px;
                      height: 12px;
                    "
                      data-icon="calendar"
                      data-component="@globalComponents/Icon.jsx"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12px"
                        height="12px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="4"
                        >
                          <path d="M8 2v4m8-4v4"></path>
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                          ></rect>
                          <path d="M3 10h18"></path>
                        </g></svg></span
                    ><span class="text-xs">Aug 14</span>
                  </div>
                  <div
                    class="flex w-10 flex-shrink-0 items-center justify-center"
                  >
                    <button
                      class="rounded p-1 text-muted-foreground"
                      data-media-type="banani-button"
                    >
                      <span
                        class=""
                        style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        width: 15px;
                        height: 15px;
                      "
                        data-icon="more-horizontal"
                        data-component="@globalComponents/Icon.jsx"
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15px"
                          height="15px"
                          viewBox="0 0 24 24"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3.2"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </g></svg
                      ></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
    <script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>
  </div>
</design>
```
