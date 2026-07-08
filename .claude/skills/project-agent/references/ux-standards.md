# UX Standards - World-Class Checklist

Every user-facing feature MUST meet these standards. Non-negotiable for production.

---

## Visual Design

### Typography

- [ ] Font hierarchy clear (h1 > h2 > h3 > body > caption)
- [ ] Line height 1.4-1.6 for body text
- [ ] Maximum 75 characters per line for readability
- [ ] Adequate contrast (WCAG AA minimum: 4.5:1 body, 3:1 large)

### Spacing

- [ ] Consistent spacing scale (4px, 8px, 16px, 24px, 32px, 48px)
- [ ] Adequate whitespace - don't crowd elements
- [ ] Clear visual grouping through proximity

### Components

- [ ] Buttons have clear hover/active/disabled states
- [ ] Form inputs have focus states (visible outline)
- [ ] Icons consistent in style and size

---

## Interaction Design

### Feedback

- [ ] Every action has immediate visual feedback
- [ ] Loading states for async operations (skeleton/spinner)
- [ ] Success confirmations (toast/message)
- [ ] Error states are clear and actionable

### Forms

- [ ] Labels always visible (no placeholder-only)
- [ ] Inline validation with helpful messages
- [ ] Required fields clearly marked
- [ ] Submit button disabled while processing

### Navigation

- [ ] Current location always clear
- [ ] Back navigation works as expected
- [ ] No dead ends

---

## Responsiveness

### Breakpoints

- [ ] Mobile: 320px - 767px
- [ ] Tablet: 768px - 1023px
- [ ] Desktop: 1024px+

### Mobile Specific

- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scroll
- [ ] Readable without zooming

---

## Accessibility (WCAG 2.1 AA)

- [ ] Alt text for all images
- [ ] Color contrast meets standards
- [ ] Full keyboard navigation
- [ ] Focus visible at all times
- [ ] Valid HTML
- [ ] ARIA used correctly (or not at all)

---

## Performance

- [ ] First Contentful Paint <1.8s
- [ ] Largest Contentful Paint <2.5s
- [ ] Images lazy loaded
- [ ] Skeleton screens for slow content

---

## Quick Audit Checklist

Before marking a feature complete:

```
□ Does it look good? (Visual Design)
□ Does it feel good? (Interactions)
□ Does it work on mobile? (Responsive)
□ Can everyone use it? (Accessibility)
□ Is it fast? (Performance)
□ What happens when things go wrong? (Errors)
```
