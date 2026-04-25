import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, radius, typography } from '../theme';
import { pickupJobs, JOB_STATUSES } from '../data/mockData';
import JobCard from '../components/JobCard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: JOB_STATUSES.PENDING, label: 'Pending' },
  { id: JOB_STATUSES.ACCEPTED, label: 'Accepted' },
  { id: JOB_STATUSES.COMPLETED, label: 'Completed' },
];

export default function JobListScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredJobs = useMemo(() => {
    if (activeFilter === 'all') {
      return pickupJobs.filter(
        (j) => j.status !== JOB_STATUSES.CANCELLED,
      );
    }
    if (activeFilter === JOB_STATUSES.ACCEPTED) {
      return pickupJobs.filter(
        (j) =>
          j.status === JOB_STATUSES.ACCEPTED ||
          j.status === JOB_STATUSES.EN_ROUTE,
      );
    }
    return pickupJobs.filter((j) => j.status === activeFilter);
  }, [activeFilter]);

  const handleJobPress = (job) => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('JobDetailScreen', { job });
    }
  };

  const renderFilter = ({ item }) => {
    const isActive = activeFilter === item.id;
    const count =
      item.id === 'all'
        ? pickupJobs.filter((j) => j.status !== JOB_STATUSES.CANCELLED).length
        : item.id === JOB_STATUSES.ACCEPTED
        ? pickupJobs.filter(
            (j) =>
              j.status === JOB_STATUSES.ACCEPTED ||
              j.status === JOB_STATUSES.EN_ROUTE,
          ).length
        : pickupJobs.filter((j) => j.status === item.id).length;

    return (
      <TouchableOpacity
        style={styles.filterTab}
        onPress={() => setActiveFilter(item.id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterLabel,
            isActive ? styles.filterLabelActive : styles.filterLabelInactive,
          ]}
        >
          {item.label}
          {count > 0 ? `  ${count}` : ''}
        </Text>
        <View
          style={[
            styles.filterUnderline,
            isActive && styles.filterUnderlineActive,
          ]}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
      </View>

      <View style={styles.filtersBar}>
        <FlatList
          data={FILTERS}
          keyExtractor={(item) => item.id}
          renderItem={renderFilter}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => handleJobPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No jobs here yet</Text>
            <Text style={styles.emptySub}>
              New requests will show up the moment a household nearby books a pickup.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  filtersBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  filtersContent: {
    paddingHorizontal: spacing.md,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
    paddingBottom: spacing.sm,
  },
  filterLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  filterLabelInactive: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterUnderline: {
    height: 2,
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 2,
  },
  filterUnderlineActive: {
    backgroundColor: colors.primary,
  },
  listContent: {
    paddingVertical: spacing.sm,
    paddingBottom: 120,
  },
  emptyWrap: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  emptySub: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});
