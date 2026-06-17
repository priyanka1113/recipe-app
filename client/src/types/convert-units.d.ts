declare module "convert-units" {
  type FromConverter = {
    to(unit: string): number;
  };

  type Converter = {
    from(unit: string): FromConverter;
  };

  export default function convert(value: number): Converter;
}
