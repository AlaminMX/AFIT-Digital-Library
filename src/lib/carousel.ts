export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  image_url: string;
  cta_text?: string;
  cta_url?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const FALLBACK_SLIDES: CarouselSlide[] = [
  {
    id: "c1000000-0000-4000-8000-000000000001",
    title: "Aeronautics & Defense Systems Archive",
    description: "Access over 15,000 peer-reviewed technical reports, propulsion research, and aerospace engineering papers.",
    image_url: "https://images.unsplash.com/photo-1517976487502-d5966a3d92fb?auto=format&fit=crop&w=1600&q=80",
    cta_text: "Explore Aerospace Papers",
    cta_url: "/departments/aerospace-engineering",
    display_order: 1,
    is_active: true,
  },
  {
    id: "c1000000-0000-4000-8000-000000000002",
    title: "Artificial Intelligence & Autonomous Robotics",
    description: "Cutting-edge publications in autonomous control algorithms, cyber defence analytics, and computer vision systems.",
    image_url: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1600&q=80",
    cta_text: "View AI Publications",
    cta_url: "/departments/artificial-intelligence",
    display_order: 2,
    is_active: true,
  },
  {
    id: "c1000000-0000-4000-8000-000000000003",
    title: "National Defense Journal & Academic Proceedings",
    description: "Official periodicals and strategic military logistics studies published by accredited AFIT faculty boards.",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
    cta_text: "Read Periodicals",
    cta_url: "/departments/cyber-security",
    display_order: 3,
    is_active: true,
  },
];

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  const token = sessionStorage.getItem("afit_admin_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function getActiveCarouselSlides(): Promise<CarouselSlide[]> {
  try {
    const res = await fetch("/api/carousel");
    if (!res.ok) {
      return FALLBACK_SLIDES.filter(s => s.is_active);
    }
    const data = await res.json();
    if (data && Array.isArray(data.slides)) {
      return data.slides;
    }
    return FALLBACK_SLIDES;
  } catch (err) {
    console.error("Failed to fetch carousel slides:", err);
    return FALLBACK_SLIDES;
  }
}

export async function getAllCarouselSlidesAdmin(): Promise<CarouselSlide[]> {
  const res = await fetch("/api/admin/carousel", {
    credentials: "include",
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch carousel slides from server");
  }

  const data = await res.json();
  return data.slides || [];
}

export async function createCarouselSlideAdmin(slide: Partial<CarouselSlide>): Promise<CarouselSlide> {
  const res = await fetch("/api/admin/carousel", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(slide)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create carousel slide");
  }

  const data = await res.json();
  return data.slide;
}

export async function updateCarouselSlideAdmin(id: string, slide: Partial<CarouselSlide>): Promise<CarouselSlide> {
  const res = await fetch(`/api/admin/carousel/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(slide)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update carousel slide");
  }

  const data = await res.json();
  return data.slide;
}

export async function deleteCarouselSlideAdmin(id: string): Promise<void> {
  const res = await fetch(`/api/admin/carousel/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete carousel slide");
  }
}

export async function uploadCarouselImageAdmin(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const headers: Record<string, string> = {};
  const token = sessionStorage.getItem("afit_admin_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "include",
    headers,
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload image");
  }

  const data = await res.json();
  return data.url;
}
