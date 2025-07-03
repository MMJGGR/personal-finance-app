import { addVersion, readVersions, clearVersions } from '../utils/versionHistory';
import storage from '../utils/storage';

describe('profile version history', () => {
  beforeEach(() => {
    localStorage.clear();
    clearVersions(storage);
  });

  test('addVersion stores snapshots', () => {
    const profile = { firstName: 'Jane' };
    addVersion(storage, profile);
    const versions = readVersions(storage);
    expect(versions).toHaveLength(1);
    expect(versions[0].profile).toEqual(profile);
  });
});
