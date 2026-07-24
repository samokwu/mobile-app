import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackPill, PrimaryButton } from '@/components/ui';
import { HOMES } from '@/data/demo';
import { formatDistance, haversineMeters, useLiveLocation } from '@/location/useLiveLocation';
import { colors, radii } from '@/theme';

export default function RouteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ home?: string }>();
  const home = HOMES[Number(params.home)] ?? HOMES[0];

  const mapRef = useRef<MapView>(null);
  const { coords, denied } = useLiveLocation();
  const fitted = useRef(false);

  // AI-generated preview of where the lockbox sits on this home; loops
  // silently in the sheet like a Live Photo.
  const player = useVideoPlayer(home.lockboxVideo ?? null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Once we have a GPS fix, frame the map around the user and the destination.
  useEffect(() => {
    if (!coords || fitted.current) return;
    fitted.current = true;
    mapRef.current?.fitToCoordinates([coords, home.coord], {
      edgePadding: {
        top: 120,
        right: 60,
        bottom: home.lockboxVideo ? 560 : 340,
        left: 60,
      },
      animated: true,
    });
  }, [coords, home.coord, home.lockboxVideo]);

  const distanceM = coords ? haversineMeters(coords, home.coord) : null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        followsUserLocation={false}
        initialRegion={{
          ...home.coord,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={home.coord} title={home.addr} description={`Lockbox LB-${home.boxId}`}>
          <View style={styles.markerOuter}>
            <View style={styles.markerInner} />
          </View>
        </Marker>
      </MapView>

      <BackPill
        label="Today"
        onPress={() => router.back()}
        style={{ position: 'absolute', left: 16, top: insets.top + 8 }}
      />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.addr}>{home.addr}</Text>
            <Text style={styles.sub}>
              Lockbox <Text style={styles.tnum}>LB-{home.boxId}</Text> · {home.city}
            </Text>
          </View>
          <Text style={styles.distance}>
            {denied ? 'GPS off' : distanceM == null ? 'Locating…' : formatDistance(distanceM)}
          </Text>
        </View>

        {denied && (
          <Text style={styles.deniedNote}>
            Location permission is required to guide you to the home. Enable it in
            Settings → OpenAccess.
          </Text>
        )}

        {home.lockboxVideo != null && (
          <View style={styles.videoCard}>
            <VideoView
              player={player}
              style={styles.video}
              contentFit="cover"
              nativeControls={false}
            />
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>LOCKBOX PREVIEW</Text>
            </View>
          </View>
        )}

        <View style={styles.hintRow}>
          <View style={styles.hintDot} />
          <Text style={styles.hintText}>Mounted left of the front door, 1.2 m up</Text>
        </View>

        <PrimaryButton
          label="Find lockbox"
          onPress={() =>
            router.push({ pathname: '/finder', params: { home: String(home.id) } })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F1EF' },
  markerOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.blue,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.blue,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
    shadowColor: colors.ink,
    shadowOpacity: 0.14,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: -10 },
    elevation: 12,
  },
  grabber: {
    width: 38,
    height: 4.5,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addr: { fontSize: 19, fontWeight: '500', letterSpacing: -0.19, color: colors.ink },
  sub: { fontSize: 13, color: colors.inkMuted, marginTop: 3 },
  tnum: { fontVariant: ['tabular-nums'] },
  distance: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.inkStrong,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  deniedNote: { fontSize: 13, lineHeight: 19, color: colors.inkMuted },
  videoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.tile,
  },
  video: { width: '100%', aspectRatio: 16 / 9 },
  videoBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(5,26,68,0.72)',
  },
  videoBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.95,
    color: '#FFFFFF',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 2,
  },
  hintDot: { width: 9, height: 9, borderRadius: 2.5, backgroundColor: colors.blue },
  hintText: { fontSize: 13, color: colors.inkMuted },
});
