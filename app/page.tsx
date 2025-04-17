'use client';

import { useEffect, useState } from 'react';
import HomepageEvents from './homepage/page';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <HomepageEvents />
    </div>
  );
}
