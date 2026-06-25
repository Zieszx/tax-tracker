import { generateSalt, deriveKey, encryptJSON, decryptJSON } from './crypto.js'
test('round-trips an object', async () => {
  const salt = generateSalt(); const key = await deriveKey('hunter2', salt)
  const enc = await encryptJSON({ a: 1, b: 'x' }, key)
  expect(typeof enc.ciphertext).toBe('string')
  expect(await decryptJSON(enc, key)).toEqual({ a: 1, b: 'x' })
})
test('wrong passcode fails to decrypt', async () => {
  const salt = generateSalt()
  const enc = await encryptJSON({ a: 1 }, await deriveKey('right', salt))
  const wrong = await deriveKey('wrong', salt)
  await expect(decryptJSON(enc, wrong)).rejects.toBeTruthy()
})
