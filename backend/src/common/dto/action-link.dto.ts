import { Expose } from 'class-transformer';

/**
 * Backend-driven affordance for detail pages. The backend owns
 * visibility, HTTP method, href, and label; the frontend renders
 * `available_actions` generically without hardcoding status rules.
 */
export class ActionLinkDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'method' })
  method: 'PATCH' | 'DELETE';

  @Expose({ name: 'href' })
  href: string;

  @Expose({ name: 'label' })
  label: string;

  @Expose({ name: 'requires_input' })
  requiresInput?: string;

  constructor(
    id: string,
    method: 'PATCH' | 'DELETE',
    href: string,
    label: string,
    requiresInput?: string,
  ) {
    this.id = id;
    this.method = method;
    this.href = href;
    this.label = label;
    if (requiresInput !== undefined) {
      this.requiresInput = requiresInput;
    }
  }
}
