import React from 'react'
import '@babel/polyfill'
import { fireEvent, cleanup, render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import ReactSearchAutocomplete from './ReactSearchAutocomplete'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  jest.clearAllMocks()
})

describe('<ReactSearchAutocomplete>', () => {
  let items = [
    {
      id: 0,
      name: 'value0'
    },
    {
      id: 1,
      name: 'value1'
    },
    {
      id: 2,
      name: 'value2'
    },
    {
      id: 3,
      name: 'value3'
    }
  ]

  let defaultProps = {
    items: items,
    placeholder: 'Search'
  }

  it('renders the search box', () => {
    const { queryByPlaceholderText, container } = render(
      <ReactSearchAutocomplete {...defaultProps} />
    )

    const inputElement = queryByPlaceholderText(/search/i)

    expect(inputElement).toBeInTheDocument()
    expect(container.getElementsByTagName('svg').length).toBe(1)
    expect(container.getElementsByClassName('wrapper').length).toBe(1)
  })

  it('returns an array of results', async () => {
    const onSearch = jest.fn()

    const { queryByPlaceholderText } = render(
      <ReactSearchAutocomplete {...defaultProps} onSearch={onSearch} useCaching={false} />
    )

    const inputElement = queryByPlaceholderText(/search/i)

    fireEvent.change(inputElement, { target: { value: 'value' } })
    await delay(300)

    expect(sessionStorage.getItem).not.toHaveBeenCalled()
    expect(sessionStorage.setItem).not.toHaveBeenCalled()
    expect(onSearch).toHaveBeenCalledWith('value', [], items)
  })

  it('returns an array of one result', async () => {
    const onSearch = jest.fn()

    const { queryByPlaceholderText } = render(
      <ReactSearchAutocomplete {...defaultProps} onSearch={onSearch} useCaching={false} />
    )

    const inputElement = queryByPlaceholderText(/search/i)

    fireEvent.change(inputElement, { target: { value: '0' } })
    await delay(300)

    expect(sessionStorage.getItem).not.toHaveBeenCalled()
    expect(sessionStorage.setItem).not.toHaveBeenCalled()
    expect(onSearch).toHaveBeenCalledWith('0', [], [{ id: 0, name: 'value0' }])
  })

  it("doesn't use sessionStorage if useCaching is false", async () => {
    const onSearch = jest.fn()

    const { queryByPlaceholderText } = render(
      <ReactSearchAutocomplete {...defaultProps} onSearch={onSearch} useCaching={false} />
    )

    const inputElement = queryByPlaceholderText(/search/i)

    fireEvent.change(inputElement, { target: { value: 'some string' } })
    await delay(300)

    expect(sessionStorage.getItem).not.toHaveBeenCalled()
    expect(sessionStorage.setItem).not.toHaveBeenCalled()
    expect(onSearch).toHaveBeenCalledWith('some string', [], [])
  })

  it('uses sessionStorage if useCaching is true', async () => {
    const onSearch = jest.fn()

    const { queryByPlaceholderText } = render(
      <ReactSearchAutocomplete {...defaultProps} onSearch={onSearch} useCaching={true} />
    )

    const inputElement = queryByPlaceholderText(/search/i)
    fireEvent.change(inputElement, { target: { value: 'some string' } })
    await delay(300)

    expect(sessionStorage.getItem).toHaveBeenCalled()
    expect(sessionStorage.setItem).toHaveBeenCalled()
    expect(onSearch).toHaveBeenCalledWith('some string', [], [])
  })

  it('retrieves cached values', async () => {
    const onSearch = jest.fn()

    const { queryByPlaceholderText } = render(
      <ReactSearchAutocomplete {...defaultProps} onSearch={onSearch} useCaching={true} />
    )

    const inputElement = queryByPlaceholderText(/search/i)

    fireEvent.change(inputElement, { target: { value: 'some string' } })

    await delay(300)
    expect(onSearch).toHaveBeenCalledWith('some string', [], [])

    fireEvent.change(inputElement, { target: { value: 'another string' } })

    await delay(300)
    expect(onSearch).toHaveBeenCalledWith('another string', [], [])

    fireEvent.change(inputElement, { target: { value: 'some string' } })

    await delay(300)
    // the first parameter is the string searched, the second is the array of results or cached results
    expect(onSearch).toHaveBeenCalledWith('some string', [], [])
  })

  it('calls onSearch on change', async () => {
    const onSearch = jest.fn()

    const { queryByPlaceholderText } = render(
      <ReactSearchAutocomplete {...defaultProps} onSearch={onSearch} />
    )

    const inputElement = queryByPlaceholderText(/search/i)

    fireEvent.change(inputElement, { target: { value: 'v' } })

    await delay(300)
    expect(onSearch).toHaveBeenCalledWith('v', [], items)
  })

  it('calls onSelect on item selection', () => {
    const onSelect = jest.fn()

    const { queryByPlaceholderText, queryAllByTitle } = render(
      <ReactSearchAutocomplete {...defaultProps} onSelect={onSelect} />
    )

    const inputElement = queryByPlaceholderText(/search/i)

    fireEvent.change(inputElement, { target: { value: 'v' } })

    const liNode = queryAllByTitle('value0')[0]

    fireEvent.mouseDown(liNode)

    expect(onSelect).toHaveBeenCalled()
  })

  it('calls onFocus on input focus', () => {
    const onFocus = jest.fn()

    const { queryByPlaceholderText } = render(
      <ReactSearchAutocomplete {...defaultProps} onFocus={onFocus} />
    )

    const inputElement = queryByPlaceholderText(/search/i)

    fireEvent.focus(inputElement)

    expect(onFocus).toHaveBeenCalled()
  })

  it('sets focus if autoFocus is true', () => {
    const { queryByPlaceholderText } = render(
      <ReactSearchAutocomplete {...defaultProps} autoFocus={true} />
    )

    const inputElement = queryByPlaceholderText(/search/i)

    expect(inputElement).toHaveFocus()
  })

  it('uses debounce on search', () => {
    jest.useFakeTimers()
    const onSearch = jest.fn()

    const { queryByPlaceholderText } = render(
      <ReactSearchAutocomplete {...defaultProps} onSearch={onSearch} />
    )

    const inputElement = queryByPlaceholderText(/search/i)

    for (let i = 0; i < 10; i++) {
      fireEvent.change(inputElement, { target: { value: Math.random() } })
    }

    jest.runAllTimers()

    expect(onSearch).toBeCalledTimes(1)
  })

  it("doesn't use debounce if inputDebounce is 0", () => {
    jest.useFakeTimers()
    const onSearch = jest.fn()

    const { queryByPlaceholderText } = render(
      <ReactSearchAutocomplete {...defaultProps} onSearch={onSearch} inputDebounce={0} />
    )

    onSearch.mockClear()

    const inputElement = queryByPlaceholderText(/search/i)

    for (let i = 0; i < 10; i++) {
      fireEvent.change(inputElement, { target: { value: Math.random() } })
    }

    jest.runAllTimers()

    expect(onSearch).toBeCalledTimes(10)
  })

  describe('with items with name property', () => {
    it('renders the search box', () => {
      const { queryByPlaceholderText, container } = render(
        <ReactSearchAutocomplete {...defaultProps} />
      )
      const inputElement = queryByPlaceholderText(/search/i)
      // check that the input node is present
      expect(inputElement).toBeInTheDocument()
      // check that the icon is present
      expect(container.getElementsByTagName('svg').length).toBe(1)
      // check that wrapper div is present
      expect(container.getElementsByClassName('wrapper').length).toBe(1)
    })

    it('shows 4 matching items', () => {
      const { queryByPlaceholderText, container } = render(
        <ReactSearchAutocomplete {...defaultProps} />
      )

      const inputElement = queryByPlaceholderText(/search/i)

      fireEvent.change(inputElement, { target: { value: 'v' } })

      const ul = container.getElementsByTagName('ul')[0]
      expect(ul.getElementsByTagName('li').length).toBe(4)
      expect(ul.getElementsByTagName('svg').length).toBe(4)
    })

    it('shows 1 matching item', () => {
      const { queryByPlaceholderText, queryAllByTitle, container } = render(
        <ReactSearchAutocomplete {...defaultProps} />
      )

      const inputElement = queryByPlaceholderText(/search/i)

      fireEvent.change(inputElement, { target: { value: '0' } })

      expect(queryAllByTitle('value0').length).toBe(1)
      const ul = container.getElementsByTagName('ul')[0]
      expect(ul.getElementsByTagName('li').length).toBe(1)
      expect(ul.getElementsByTagName('svg').length).toBe(1)
    })

    it('shows 0 matching items', () => {
      const { queryByPlaceholderText, container } = render(
        <ReactSearchAutocomplete {...defaultProps} />
      )

      const inputElement = queryByPlaceholderText(/search/i)

      fireEvent.change(inputElement, { target: { value: 'despair' } })

      expect(container.getElementsByTagName('ul').length).toBe(0)
    })
  })

  describe('with items with custom properties property', () => {
    const items = [
      {
        id: 0,
        title: 'Titanic',
        description: 'A movie about love'
      },
      {
        id: 1,
        title: 'Dead Poets Society',
        description: 'A movie about poetry and the meaning of life'
      },
      {
        id: 2,
        title: 'Terminator 2',
        description: 'A robot from the future is sent back in time'
      },
      {
        id: 3,
        title: 'Alien 2',
        description: 'Ripley is back for a new adventure'
      }
    ]

    const defaultProps = {
      items: items,
      placeholder: 'Search',
      onSearch: () => {},
      fuseOptions: { keys: ['title', 'description'] },
      resultStringKeyName: 'title'
    }

    it('shows 4 matching items', () => {
      const { queryByPlaceholderText, container } = render(
        <ReactSearchAutocomplete {...defaultProps} />
      )

      const inputElement = queryByPlaceholderText(/search/i)

      fireEvent.change(inputElement, { target: { value: 'a' } })

      const ul = container.getElementsByTagName('ul')[0]
      expect(ul.getElementsByTagName('li').length).toBe(4)
      expect(ul.getElementsByTagName('svg').length).toBe(4)
    })

    it('shows 1 matching item', () => {
      const { queryByPlaceholderText, queryAllByTitle, container } = render(
        <ReactSearchAutocomplete {...defaultProps} />
      )

      const inputElement = queryByPlaceholderText(/search/i)

      fireEvent.change(inputElement, { target: { value: 'dead' } })

      expect(queryAllByTitle('Dead Poets Society').length).toBe(1)
      const ul = container.getElementsByTagName('ul')[0]
      expect(ul.getElementsByTagName('li').length).toBe(1)
      expect(ul.getElementsByTagName('svg').length).toBe(1)
    })

    it('shows 0 matching item', () => {
      const { queryByPlaceholderText, container } = render(
        <ReactSearchAutocomplete {...defaultProps} />
      )

      const inputElement = queryByPlaceholderText(/search/i)

      fireEvent.change(inputElement, { target: { value: 'despaira' } })

      expect(container.getElementsByTagName('ul').length).toBe(0)
    })
  })

  describe('with many items', () => {
    const items = [...new Array(10000)].map((_, i) => {
      return {
        id: i,
        title: `something${i}`,
        description:
          'A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array. Calls a defined callback function on each element of an array, and returns an array that contains the results.'
      }
    })

    const defaultProps = {
      items: items,
      placeholder: 'Search',
      onSearch: () => {},
      fuseOptions: { keys: ['title', 'description'] },
      resultStringKeyName: 'title'
    }

    it('renders and display resulst', () => {
      const { queryByPlaceholderText, container } = render(
        <ReactSearchAutocomplete {...defaultProps} />
      )

      const inputElement = queryByPlaceholderText(/search/i)

      fireEvent.change(inputElement, { target: { value: 'something' } })

      const ul = container.getElementsByTagName('ul')[0]
      expect(ul.getElementsByTagName('li').length).toBe(10)
      expect(ul.getElementsByTagName('svg').length).toBe(10)
    })
  })
})