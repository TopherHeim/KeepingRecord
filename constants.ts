import { Album } from "./types";

export const INITIAL_RECORDS: Album[] = [
  {
    id: '1',
    title: 'Abbey Road',
    artist: 'The Beatles',
    genre: 'Rock',
    year: 1969,
    spineColor: '#88C0D0',
    addedAt: new Date().toISOString(),
    status: 'collection'
  },
  {
    id: '2',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    genre: 'Progressive Rock',
    year: 1973,
    spineColor: '#2E3440',
    addedAt: new Date().toISOString(),
    status: 'collection'
  },
  {
    id: '3',
    title: 'Rumours',
    artist: 'Fleetwood Mac',
    genre: 'Soft Rock',
    year: 1977,
    spineColor: '#BF616A',
    addedAt: new Date().toISOString(),
    status: 'collection'
  },
  {
    id: '4',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    genre: 'Jazz',
    year: 1959,
    spineColor: '#5E81AC',
    addedAt: new Date().toISOString(),
    status: 'collection'
  },
  {
    id: '5',
    title: 'Thriller',
    artist: 'Michael Jackson',
    genre: 'Pop',
    year: 1982,
    spineColor: '#D08770',
    addedAt: new Date().toISOString(),
    status: 'collection'
  },
  {
    id: '6',
    title: 'Back to Black',
    artist: 'Amy Winehouse',
    genre: 'Soul',
    year: 2006,
    spineColor: '#4C566A',
    addedAt: new Date().toISOString(),
    status: 'collection'
  }
];