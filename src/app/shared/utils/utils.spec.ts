import { Utils } from './utils'

describe('Utils', () => {
  describe('sortByLocale', () => {
    it('should return 0 when both strings are identical', () => {
      const result = Utils.sortByLocale('apple', 'apple')
      expect(result).toBe(0)
    })

    it('should correctly sort strings ignoring case', () => {
      expect(Utils.sortByLocale('apple', 'Banana')).toBeLessThan(0)
      expect(Utils.sortByLocale('Banana', 'apple')).toBeGreaterThan(0)
    })

    it('should correctly sort strings with different cases', () => {
      expect(Utils.sortByLocale('Apple', 'apple')).toBe(0)
      expect(Utils.sortByLocale('apple', 'Apple')).toBe(0)
    })

    it('should correctly sort strings with special characters', () => {
      expect(Utils.sortByLocale('café', 'Cafe')).toBeGreaterThan(0)
      expect(Utils.sortByLocale('Cafe', 'café')).toBeLessThan(0)
    })

    it('should correctly sort strings with different alphabets', () => {
      expect(Utils.sortByLocale('äpple', 'banana')).toBeLessThan(0)
      expect(Utils.sortByLocale('banana', 'äpple')).toBeGreaterThan(0)
    })

    it('should correctly sort strings with numbers', () => {
      expect(Utils.sortByLocale('apple1', 'apple2')).toBeLessThan(0)
      expect(Utils.sortByLocale('apple2', 'apple1')).toBeGreaterThan(0)
    })
  })

  describe('limitText', () => {
    it('should truncate text that exceeds the specified limit', () => {
      const result = Utils.limitText('hello', 4)

      expect(result).toEqual('hell...')
    })

    it('should return the original text if it does not exceed the limit', () => {
      const result = Utils.limitText('hello', 6)

      expect(result).toEqual('hello')
    })

    it('should return an empty string for undefined input', () => {
      const str: string | undefined = undefined
      const result = Utils.limitText(str, 5)

      expect(result).toEqual('')
    })

    it('should handle zero length text', () => {
      const result = Utils.limitText(null, 4)
      expect(result).toEqual('')
    })
  })
})
