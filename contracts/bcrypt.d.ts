declare module 'bcrypt' {
  function hash(data: string | Buffer, saltOrRounds: number | string): Promise<string>
  function compare(data: string | Buffer, encrypted: string): Promise<boolean>
}
