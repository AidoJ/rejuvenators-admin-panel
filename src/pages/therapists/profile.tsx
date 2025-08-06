// ========================================
// REUSABLE COMPONENT: src/components/TherapistPhoto.tsx
// For displaying therapist photos throughout the app
// ========================================

import React from 'react';
import { Avatar, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TherapistPhotoProps {
  therapistId: string;
  photoUrl?: string;
  name?: string;
  size?: number;
  showBio?: boolean;
  bio?: string;
}

// Image optimization helper
const getOptimizedImageUrl = (originalUrl: string, width?: number, height?: number): string => {
  if (!originalUrl) return '';
  
  try {
    const url = new URL(originalUrl);
    if (width) url.searchParams.set('width', width.toString());
    if (height) url.searchParams.set('height', height.toString());
    url.searchParams.set('quality', '80');
    return url.toString();
  } catch {
    return originalUrl; // Return original if URL parsing fails
  }
};

export const TherapistPhoto: React.FC<TherapistPhotoProps> = ({
  photoUrl,
  name,
  size = 64,
  showBio = false,
  bio
}) => {
  const optimizedUrl = photoUrl ? getOptimizedImageUrl(photoUrl, size * 2, size * 2) : undefined;

  return (
    <Space direction="vertical" align="center" style={{ textAlign: 'center' }}>
      <Avatar
        size={size}
        src={optimizedUrl}
        icon={<UserOutlined />}
        style={{ 
          border: photoUrl ? '2px solid #f0f0f0' : 'none',
          boxShadow: photoUrl ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
        }}
      />
      
      {name && (
        <Text strong style={{ fontSize: size > 80 ? '16px' : '14px' }}>
          {name}
        </Text>
      )}
      
      {showBio && bio && (
        <Text 
          type="secondary" 
          style={{ 
            fontSize: '12px',
            maxWidth: '200px',
            textAlign: 'center'
          }}
          ellipsis={{ tooltip: bio }}
        >
          {bio}
        </Text>
      )}
    </Space>
  );
};
