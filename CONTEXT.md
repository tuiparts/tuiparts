# tuiparts.sh

tuiparts.sh separates reusable terminal behavior from presentation that an
application owns.

## Language

**Primitive**:
A versioned, visually unstyled behavior unit composed from public Parts.
_Avoid_: Foundation primitive, component

**Part**:
A named public node with a behavior or semantic responsibility inside a
Primitive.
_Avoid_: Style slot

**Recipe**:
Editable presentation source that composes Primitives and belongs to the
application after installation.
_Avoid_: Foundation recipe, packaged component

**Adapter**:
A framework binding that exposes Core Primitive behavior to React or Solid.
_Avoid_: Wrapper

**Catalog**:
The user-facing collection of available Recipes.
_Avoid_: Registry

**Registry**:
The serving layer and URL namespace that distributes Recipe source.
_Avoid_: Catalog

**Foundation**:
The linked release line for the Core, React, and Solid packages. Use the term
only for release scope, release validation, and versioning.
_Avoid_: Foundation behavior, Foundation module, Foundation Recipe

**Companion package**:
An independently versioned convenience product outside the Foundation release
line.
_Avoid_: Primitive
