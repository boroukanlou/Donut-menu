const mockData = [
  {
    label: "گسترش مرتبطین",
    value: "expand_related",
    icon: "group",
    children: [
      { label: "کاربر", value: "user" },
      { label: "تلفن", value: "phone" },
      { label: "مکان", value: "location" },
      { label: "قرارداد", value: "contract" },
      { label: "کارت بانکی", value: "bank_card" },
      { label: "حساب بانکی", value: "bank_account" },
      { label: "سند", value: "document" },
      { label: "انتخاب همه", value: "select_all" },
    ],
  },
  {
    label: "نمایش",
    value: "show",
    icon: "visibility",
    children: [
      { label: "نمایش خلاصه", value: "show_summary" },
      { label: "نمایش جزئیات", value: "show_detail" },
    ],
  },
  {
    label: "کپی",
    value: "copy",
    icon: "content_copy",
    children: [],
  },
  {
    label: "ویرایش",
    value: "edit",
    icon: "edit",
    children: [],
  },
  {
    label: "افزودن مشابه",
    value: "add_similar",
    icon: "control_point_duplicate",
    children: [],
  },
  {
    label: "جستجوی مشخصه",
    value: "search_feature",
    icon: "search",
    children: [],
  },
  {
    label: "افزودن از سرویس",
    value: "add_from_service",
    icon: "cloud_download",
    children: [
      { label: "سرویس مبارزه با پولشویی", value: "service_aml" },
      { label: "بانک مرکزی", value: "central_bank" },
      { label: "رخنما", value: "rakhnama" },
      { label: "سازمان مالیاتی", value: "tax_organization" },
      { label: "لیست سفید", value: "white_list" },
    ],
  },
  {
    label: "گسترش روابط",
    value: "expand_relations",
    icon: "device_hub",
    children: [],
  },
];

export default mockData;
