import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SHADOWS } from '../styles/theme';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../utils/storage';
import { Notification } from '../types';

const { width } = Dimensions.get('window');

interface NotificationsScreenProps {
  navigation: NavigationProp<any>;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    await loadNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      await loadNotifications();
    }
    
    // Navigate to related screen if applicable
    if (notification.relatedId && notification.type === 'budget_warning') {
      navigation.navigate('Budget');
    } else if (notification.relatedId && notification.type === 'goal_achieved') {
      (navigation.navigate as any)('Goals');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteNotification(id);
    await loadNotifications();
  };

  const groupNotifications = () => {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = today - 86400000;

    const groups = {
      today: [] as Notification[],
      yesterday: [] as Notification[],
      earlier: [] as Notification[],
    };

    notifications.forEach((notif) => {
      const notifDate = new Date(notif.createdAt).setHours(0, 0, 0, 0);
      if (notifDate === today) {
        groups.today.push(notif);
      } else if (notifDate === yesterday) {
        groups.yesterday.push(notif);
      } else {
        groups.earlier.push(notif);
      }
    });

    return groups;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF4444';
      case 'medium':
        return '#FFA500';
      case 'low':
        return '#4ECDC4';
      default:
        return theme.primary;
    }
  };

  const groups = groupNotifications();
  const hasNotifications = notifications.length > 0;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? theme.surface : '#FFF' }]}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={{ fontSize: 24, color: theme.text }}>‹</Text>
        </TouchableOpacity>

        {/* Center Title */}
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifikasi</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Mark All Button */}
        <View style={styles.headerRight}>
          {hasNotifications && unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text style={[styles.markAllButton, { color: COLORS.primary }]}>Tandai Semua</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 110 }} />
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {!hasNotifications ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 80, marginBottom: 20 }}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Belum Ada Notifikasi</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Notifikasi penting akan muncul di sini
            </Text>
          </View>
        ) : (
          <>
            {/* Today */}
            {groups.today.length > 0 && (
              <View style={styles.group}>
                <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>Hari Ini</Text>
                {groups.today.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    theme={theme}
                    isDark={isDark}
                    priorityColor={getPriorityColor(notif.priority)}
                    onPress={() => handleNotificationPress(notif)}
                    onDelete={() => handleDeleteNotification(notif.id)}
                  />
                ))}
              </View>
            )}

            {/* Yesterday */}
            {groups.yesterday.length > 0 && (
              <View style={styles.group}>
                <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>Kemarin</Text>
                {groups.yesterday.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    theme={theme}
                    isDark={isDark}
                    priorityColor={getPriorityColor(notif.priority)}
                    onPress={() => handleNotificationPress(notif)}
                    onDelete={() => handleDeleteNotification(notif.id)}
                  />
                ))}
              </View>
            )}

            {/* Earlier */}
            {groups.earlier.length > 0 && (
              <View style={styles.group}>
                <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>Sebelumnya</Text>
                {groups.earlier.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    theme={theme}
                    isDark={isDark}
                    priorityColor={getPriorityColor(notif.priority)}
                    onPress={() => handleNotificationPress(notif)}
                    onDelete={() => handleDeleteNotification(notif.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

interface NotificationCardProps {
  notification: Notification;
  theme: any;
  isDark: boolean;
  priorityColor: string;
  onPress: () => void;
  onDelete: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  theme,
  isDark,
  priorityColor,
  onPress,
  onDelete,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderLeftColor: priorityColor,
            opacity: notification.isRead ? 0.6 : 1,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.iconCircle, { backgroundColor: priorityColor + '15' }]}>
            <Text style={{ fontSize: 24 }}>{notification.icon}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {notification.title}
            {!notification.isRead && <View style={styles.unreadDot} />}
          </Text>
          <Text style={[styles.cardMessage, { color: theme.textSecondary }]} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={[styles.cardTime, { color: theme.textMuted }]}>
            {formatTime(notification.createdAt)}
          </Text>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={{ fontSize: 18, color: '#FF4444' }}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 35,
    paddingHorizontal: 20,
    paddingBottom: 12,
    ...SHADOWS.small,
  },
  backButton: {
    width: 110,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  headerRight: {
    width: 110,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  markAllButton: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  group: {
    marginBottom: 28,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    ...SHADOWS.small,
  },
  cardLeft: {
    marginRight: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  cardMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.5,
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationsScreen;
