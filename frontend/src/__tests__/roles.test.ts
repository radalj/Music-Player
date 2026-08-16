import { canManageAdminSettings, canUseSubscriptions, canViewArtistStats, isSupportStaff } from '@/utils/roles';

describe('canViewArtistStats', () => {
  it('allows silver and gold listeners', () => {
    expect(canViewArtistStats('silver', 'listener')).toBe(true);
    expect(canViewArtistStats('gold', 'listener')).toBe(true);
  });

  it('allows admins regardless of plan', () => {
    expect(canViewArtistStats('free', 'admin')).toBe(true);
  });

  it('blocks free listeners', () => {
    expect(canViewArtistStats('free', 'listener')).toBe(false);
    expect(canViewArtistStats(undefined, 'listener')).toBe(false);
  });
});

describe('canUseSubscriptions', () => {
  it('hides the plans page from artists, admins and supporters', () => {
    expect(canUseSubscriptions('artist')).toBe(false);
    expect(canUseSubscriptions('admin')).toBe(false);
    expect(canUseSubscriptions('supporter')).toBe(false);
    expect(canUseSubscriptions('listener')).toBe(true);
  });
});

describe('support staff roles', () => {
  it('treats admin and supporter as dashboard staff', () => {
    expect(isSupportStaff('admin')).toBe(true);
    expect(isSupportStaff('supporter')).toBe(true);
    expect(isSupportStaff('listener')).toBe(false);
  });

  it('reserves plan-price settings for admins only', () => {
    expect(canManageAdminSettings('admin')).toBe(true);
    expect(canManageAdminSettings('supporter')).toBe(false);
    expect(canManageAdminSettings('listener')).toBe(false);
  });
});
