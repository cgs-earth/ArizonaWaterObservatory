/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-alert */
import Delete from '@/assets/Delete';
import Map from '@/assets/Map';
import Button from '@/components/Button';
import Menu from '@/components/Menu';
import { Section } from '@/components/Menu/types';

export default {
  title: 'Menu',
  component: Menu,
};

export const Empty = () => <Menu target={<Button>Click</Button>} sections={[]} />;

export const WithActions = () => {
  const sections: Section[] = [
    {
      title: 'Account',
      items: [
        {
          label: 'Profile',
          left: <Map />,
          onClick: () => window.alert('Profile clicked'),
        },
        {
          label: 'Settings',
          left: <Delete />,
          onClick: () => window.alert('Settings clicked'),
        },
      ],
    },
  ];

  return <Menu target={<Button>Open Menu</Button>} sections={sections} />;
};

export const WithSubItems = () => {
  const sections: Section[] = [
    {
      title: 'Projects',
      items: [
        {
          label: 'Project A',
          subItems: [
            {
              label: 'Overview',
              onClick: () => window.alert('Project A Overview'),
            },
            {
              label: 'Team',
              onClick: () => window.alert('Project A Team'),
            },
          ],
        },
        {
          label: 'Project B',
          subItems: [
            {
              label: 'Overview',
              onClick: () => window.alert('Project B Overview'),
            },
            {
              label: 'Team',
              onClick: () => window.alert('Project B Team'),
            },
          ],
        },
      ],
    },
  ];

  return <Menu target={<Button>Projects</Button>} sections={sections} />;
};

export const Mixed = () => {
  const sections: Section[] = [
    {
      title: 'General',
      items: [
        {
          label: 'Dashboard',
          onClick: () => window.alert('Dashboard clicked'),
        },
        {
          label: 'Reports',
          subItems: [
            {
              label: 'Monthly',
              onClick: () => window.alert('Monthly report'),
            },
            {
              label: 'Annual',
              onClick: () => window.alert('Annual report'),
            },
          ],
        },
      ],
    },
  ];

  return <Menu target={<Button>Mixed Menu</Button>} sections={sections} />;
};
