import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/shared/components/app-layout";
import { DepartmentPage } from "@/features/departments/pages/department-page";
import { DepartmentsPage } from "@/features/departments/pages/departments-page";
import { DepartmentBooksPage } from "@/features/departments/pages/department-books-page";
import { DepartmentJournalsPage } from "@/features/departments/pages/department-journals-page";
import { AdminDashboardPage } from "@/features/admin/pages/admin-dashboard-page";
import { OfflinePage } from "@/features/offline/pages/offline-page";
import { HomePage } from "@/features/home/pages/home-page";
import { NotFoundPage } from "@/features/not-found/pages/not-found-page";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "departments", element: <DepartmentsPage /> },
      { path: "departments/:slug", element: <DepartmentPage /> },
      { path: "departments/:slug/books", element: <DepartmentBooksPage /> },
      { path: "departments/:slug/journals", element: <DepartmentJournalsPage /> },
      { path: "offline", element: <OfflinePage /> },
      { path: "admin", element: <AdminDashboardPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
