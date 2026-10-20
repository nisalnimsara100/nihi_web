import type { ComponentType } from "react";
import type { Icon, IconProps } from "@phosphor-icons/react";
import {
  AirplaneIcon,
  ArrowDownLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ArrowsLeftRightIcon,
  BabyIcon,
  BankIcon,
  BarbellIcon,
  BasketIcon,
  BeerSteinIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingsIcon,
  BusIcon,
  CarIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChartBarIcon,
  ChartLineIcon,
  CheckIcon,
  CircleNotchIcon,
  CoffeeIcon,
  ConfettiIcon,
  CreditCardIcon,
  DeviceMobileIcon,
  DogIcon,
  DotsThreeIcon,
  DropIcon,
  EyeIcon,
  EyeSlashIcon,
  FilmSlateIcon,
  ForkKnifeIcon,
  GameControllerIcon,
  GasPumpIcon,
  GearSixIcon,
  GiftIcon,
  GitBranchIcon,
  GlobeIcon,
  GraduationCapIcon,
  HandCoinsIcon,
  HeartbeatIcon,
  HouseIcon,
  InvoiceIcon,
  LaptopIcon,
  LightningIcon,
  LockIcon,
  MagnifyingGlassIcon,
  MoneyIcon,
  MusicNotesIcon,
  PaletteIcon,
  PencilSimpleIcon,
  PiggyBankIcon,
  PillIcon,
  PlusIcon,
  ReceiptIcon,
  ScissorsIcon,
  ShapesIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
  StethoscopeIcon,
  TShirtIcon,
  TagIcon,
  TicketIcon,
  TrainIcon,
  TrashIcon,
  TreePalmIcon,
  TrendUpIcon,
  UserCircleIcon,
  WalletIcon,
  WarningIcon,
  WifiHighIcon,
  WrenchIcon,
} from "@phosphor-icons/react/ssr";

export type { IconProps };
export type AppIcon = ComponentType<IconProps>;

/**
 * Every icon in the app comes from here: Phosphor icons in the duotone weight
 * at 24px, unless a caller passes its own `weight` or `size`. The SSR builds
 * work in both server and client components.
 */
function duotone(Base: Icon): AppIcon {
  function DuotoneIcon(props: IconProps) {
    return <Base weight="duotone" size={24} {...props} />;
  }
  DuotoneIcon.displayName = Base.displayName;
  return DuotoneIcon;
}

export const Airplane = duotone(AirplaneIcon);
export const ArrowDownLeft = duotone(ArrowDownLeftIcon);
export const ArrowRight = duotone(ArrowRightIcon);
export const ArrowUpRight = duotone(ArrowUpRightIcon);
export const ArrowsLeftRight = duotone(ArrowsLeftRightIcon);
export const Baby = duotone(BabyIcon);
export const Bank = duotone(BankIcon);
export const Barbell = duotone(BarbellIcon);
export const Basket = duotone(BasketIcon);
export const BeerStein = duotone(BeerSteinIcon);
export const BookOpen = duotone(BookOpenIcon);
export const Briefcase = duotone(BriefcaseIcon);
export const Buildings = duotone(BuildingsIcon);
export const Bus = duotone(BusIcon);
export const Car = duotone(CarIcon);
export const CaretDown = duotone(CaretDownIcon);
export const CaretLeft = duotone(CaretLeftIcon);
export const CaretRight = duotone(CaretRightIcon);
export const ChartBar = duotone(ChartBarIcon);
export const ChartLine = duotone(ChartLineIcon);
export const Check = duotone(CheckIcon);
export const CircleNotch = duotone(CircleNotchIcon);
export const Coffee = duotone(CoffeeIcon);
export const Confetti = duotone(ConfettiIcon);
export const CreditCard = duotone(CreditCardIcon);
export const DeviceMobile = duotone(DeviceMobileIcon);
export const Dog = duotone(DogIcon);
export const DotsThree = duotone(DotsThreeIcon);
export const Drop = duotone(DropIcon);
export const Eye = duotone(EyeIcon);
export const EyeSlash = duotone(EyeSlashIcon);
export const FilmSlate = duotone(FilmSlateIcon);
export const ForkKnife = duotone(ForkKnifeIcon);
export const GameController = duotone(GameControllerIcon);
export const GasPump = duotone(GasPumpIcon);
export const GearSix = duotone(GearSixIcon);
export const Gift = duotone(GiftIcon);
export const GitBranch = duotone(GitBranchIcon);
export const Globe = duotone(GlobeIcon);
export const GraduationCap = duotone(GraduationCapIcon);
export const HandCoins = duotone(HandCoinsIcon);
export const Heartbeat = duotone(HeartbeatIcon);
export const House = duotone(HouseIcon);
export const Invoice = duotone(InvoiceIcon);
export const Laptop = duotone(LaptopIcon);
export const Lightning = duotone(LightningIcon);
export const Lock = duotone(LockIcon);
export const MagnifyingGlass = duotone(MagnifyingGlassIcon);
export const Money = duotone(MoneyIcon);
export const MusicNotes = duotone(MusicNotesIcon);
export const Palette = duotone(PaletteIcon);
export const PencilSimple = duotone(PencilSimpleIcon);
export const PiggyBank = duotone(PiggyBankIcon);
export const Pill = duotone(PillIcon);
export const Plus = duotone(PlusIcon);
export const Receipt = duotone(ReceiptIcon);
export const Scissors = duotone(ScissorsIcon);
export const Shapes = duotone(ShapesIcon);
export const ShieldCheck = duotone(ShieldCheckIcon);
export const ShoppingBag = duotone(ShoppingBagIcon);
export const ShoppingCart = duotone(ShoppingCartIcon);
export const SignOut = duotone(SignOutIcon);
export const SlidersHorizontal = duotone(SlidersHorizontalIcon);
export const Stethoscope = duotone(StethoscopeIcon);
export const TShirt = duotone(TShirtIcon);
export const Tag = duotone(TagIcon);
export const Ticket = duotone(TicketIcon);
export const Train = duotone(TrainIcon);
export const Trash = duotone(TrashIcon);
export const TreePalm = duotone(TreePalmIcon);
export const TrendUp = duotone(TrendUpIcon);
export const UserCircle = duotone(UserCircleIcon);
export const Wallet = duotone(WalletIcon);
export const Warning = duotone(WarningIcon);
export const WifiHigh = duotone(WifiHighIcon);
export const Wrench = duotone(WrenchIcon);
