# Tabs Recipe

Editable Core, React, and Solid Tabs layout and labeled Tab presentation built
on the packaged `Root`, `List`, `Tab`, and `Panel` Parts. The Recipe owns all
spacing, colors, labels, and panel content.

React and Solid expose the shadcn-aligned `Tabs`, `TabsList`, `TabsTrigger`,
and `TabsContent` names. Core retains the behavior-oriented `createTabs`,
`createTabsList`, `createTabsTab`, and `createTabsPanel` factories.

Set `orientation="vertical"` on `Tabs` to coordinate Up/Down keyboard behavior
with a row-oriented Root and column-oriented List. Horizontal Tabs default to
a column-oriented Root and row-oriented List. Explicit native
`flexDirection` props override these Recipe defaults.
