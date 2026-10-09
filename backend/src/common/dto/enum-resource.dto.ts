import { Expose } from 'class-transformer';

export class EnumResourceDto {
  @Expose({ name: 'label' })
  label: string;

  @Expose({ name: 'value' })
  value: string;

  constructor(label: string, value: string) {
    this.label = label;
    this.value = value;
  }

  /**
   * Converts an `as const` enum object into an array of EnumResourceDto.
   *
   * @param enumObject - The const enum object
   * @param formatLabel - Optional function to format the key
   */
  static fromEnum<T extends Record<string, string>>(
    enumObject: T,
    formatLabel?: (key: string) => string,
  ): EnumResourceDto[] {
    return Object.entries(enumObject).map(([key, value]) => {
      const label = formatLabel
        ? formatLabel(key)
        : key
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase());
      return new EnumResourceDto(label, value);
    });
  }
}
