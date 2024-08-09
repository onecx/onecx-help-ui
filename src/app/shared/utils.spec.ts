import { SelectItem } from 'primeng/api'

import { limitText, dropDownGetLabelByValue, sortByLocale } from './utils'

describe('util functions', () => {
  describe('sortByLocale', () => {
    it('should return 0 when both strings are identical', () => {
      const result = sortByLocale('apple', 'apple')
      expect(result).toBe(0)
    })

    it('should correctly sort strings ignoring case', () => {
      expect(sortByLocale('apple', 'Banana')).toBeLessThan(0)
      expect(sortByLocale('Banana', 'apple')).toBeGreaterThan(0)
    })

    it('should correctly sort strings with different cases', () => {
      expect(sortByLocale('Apple', 'apple')).toBe(0)
      expect(sortByLocale('apple', 'Apple')).toBe(0)
    })

    it('should correctly sort strings with special characters', () => {
      expect(sortByLocale('café', 'Cafe')).toBeGreaterThan(0)
      expect(sortByLocale('Cafe', 'café')).toBeLessThan(0)
    })

    it('should correctly sort strings with different alphabets', () => {
      expect(sortByLocale('äpple', 'banana')).toBeLessThan(0)
      expect(sortByLocale('banana', 'äpple')).toBeGreaterThan(0)
    })

    it('should correctly sort strings with numbers', () => {
      expect(sortByLocale('apple1', 'apple2')).toBeLessThan(0)
      expect(sortByLocale('apple2', 'apple1')).toBeGreaterThan(0)
    })
  })

  describe('limitText', () => {
    it('should truncate text that exceeds the specified limit', () => {
      const result = limitText('hello', 4)

      expect(result).toEqual('hell...')
    })

    it('should return the original text if it does not exceed the limit', () => {
      const result = limitText('hello', 6)

      expect(result).toEqual('hello')
    })

    it('should return an empty string for undefined input', () => {
      const str: any = undefined
      const result = limitText(str, 5)

      expect(result).toEqual('')
    })

    it('should handle zero length text', () => {
      const result = limitText(null, 4)
      expect(result).toEqual('')
    })
  })

  describe('dropDownGetLabelByValue', () => {
    it('should return the label corresponding to the value', () => {
      const items: SelectItem[] = [
        { label: 'label2', value: 2 },
        { label: 'label1', value: 1 }
      ]

      const result = dropDownGetLabelByValue(items, '1')

      expect(result).toEqual('label1')
    })
  })
})
