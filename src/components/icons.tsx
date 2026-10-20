import type { ComponentType } from "react";
import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from "@hugeicons/react";
import {
  Add01Icon,
  Airplane01Icon,
  Alert02Icon,
  ArrowDataTransferHorizontalIcon,
  ArrowDown01Icon,
  ArrowDownLeft01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowUpRight01Icon,
  Baby01Icon,
  BankIcon,
  BeerIcon,
  BookOpen01Icon,
  Briefcase01Icon,
  Building03Icon,
  Bus01Icon,
  Car01Icon,
  Cash01Icon,
  ChartColumnIcon,
  ChartIncreaseIcon,
  ChartLineData01Icon,
  Coffee01Icon,
  CreditCardIcon,
  Delete02Icon,
  DropletIcon,
  Dumbbell01Icon,
  Film01Icon,
  FilterHorizontalIcon,
  FlashIcon,
  FuelStationIcon,
  GameController01Icon,
  GiftIcon,
  GitBranchIcon,
  Globe02Icon,
  HandCoinsIcon,
  Home01Icon,
  Invoice01Icon,
  Invoice03Icon,
  LaptopIcon,
  Loading03Icon,
  LockIcon,
  Logout03Icon,
  Medicine02Icon,
  MoreHorizontalIcon,
  Mortarboard01Icon,
  MusicNote03Icon,
  PaintBoardIcon,
  PartyIcon,
  PawPrintIcon,
  PencilEdit02Icon,
  PiggyBankIcon,
  Pulse01Icon,
  Restaurant01Icon,
  Scissor01Icon,
  Search01Icon,
  Settings02Icon,
  ShapesIcon,
  ShieldCheckIcon,
  ShoppingBag01Icon,
  ShoppingBasket01Icon,
  ShoppingCart01Icon,
  SmartPhone01Icon,
  Stethoscope02Icon,
  TShirtIcon,
  Tag01Icon,
  Tick02Icon,
  Flag01Icon,
  Notification01Icon,
  CheckmarkSquare02Icon,
  RepeatIcon,
  Target01Icon,
  DragDropVerticalIcon,
  UnavailableIcon,
  Calendar03Icon,
  Camera01Icon,
  Cancel01Icon,
  Image01Icon,
  ScanEyeIcon,
  Ticket01Icon,
  Train01Icon,
  TreePalmIcon,
  UserCircleIcon,
  ViewIcon,
  ViewOffSlashIcon,
  Wallet01Icon,
  Wifi01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

export type IconProps = Omit<HugeiconsIconProps, "icon">;
export type AppIcon = ComponentType<IconProps>;

/**
 * Every icon in the app comes from here: Hugeicons' free stroke-rounded set,
 * soft line icons with rounded ends. They render at 24px with a 1.75 stroke
 * unless a caller passes its own `size` or `strokeWidth`. The component uses
 * no hooks, so it works in both server and client components.
 */
function icon(svg: IconSvgElement, name: string): AppIcon {
  function AppIconComponent(props: IconProps) {
    return <HugeiconsIcon icon={svg} size={24} strokeWidth={1.75} {...props} />;
  }
  AppIconComponent.displayName = name;
  return AppIconComponent;
}

export const Airplane = icon(Airplane01Icon, "Airplane");
export const ArrowDownLeft = icon(ArrowDownLeft01Icon, "ArrowDownLeft");
export const ArrowRight = icon(ArrowRight02Icon, "ArrowRight");
export const ArrowUpRight = icon(ArrowUpRight01Icon, "ArrowUpRight");
export const ArrowsLeftRight = icon(ArrowDataTransferHorizontalIcon, "ArrowsLeftRight");
export const Baby = icon(Baby01Icon, "Baby");
export const Bank = icon(BankIcon, "Bank");
export const Barbell = icon(Dumbbell01Icon, "Barbell");
export const Basket = icon(ShoppingBasket01Icon, "Basket");
export const BeerStein = icon(BeerIcon, "BeerStein");
export const BookOpen = icon(BookOpen01Icon, "BookOpen");
export const Briefcase = icon(Briefcase01Icon, "Briefcase");
export const Buildings = icon(Building03Icon, "Buildings");
export const Bus = icon(Bus01Icon, "Bus");
export const Car = icon(Car01Icon, "Car");
export const CaretDown = icon(ArrowDown01Icon, "CaretDown");
export const CaretLeft = icon(ArrowLeft01Icon, "CaretLeft");
export const CaretRight = icon(ArrowRight01Icon, "CaretRight");
export const ChartBar = icon(ChartColumnIcon, "ChartBar");
export const ChartLine = icon(ChartLineData01Icon, "ChartLine");
export const Calendar = icon(Calendar03Icon, "Calendar");
export const DragHandle = icon(DragDropVerticalIcon, "DragHandle");
export const Camera = icon(Camera01Icon, "Camera");
export const Check = icon(Tick02Icon, "Check");
export const ImageSquare = icon(Image01Icon, "ImageSquare");
export const Scan = icon(ScanEyeIcon, "Scan");
export const X = icon(Cancel01Icon, "X");
export const CircleNotch = icon(Loading03Icon, "CircleNotch");
export const Coffee = icon(Coffee01Icon, "Coffee");
export const Confetti = icon(PartyIcon, "Confetti");
export const CreditCard = icon(CreditCardIcon, "CreditCard");
export const DeviceMobile = icon(SmartPhone01Icon, "DeviceMobile");
export const Dog = icon(PawPrintIcon, "Dog");
export const DotsThree = icon(MoreHorizontalIcon, "DotsThree");
export const Drop = icon(DropletIcon, "Drop");
export const Eye = icon(ViewIcon, "Eye");
export const EyeSlash = icon(ViewOffSlashIcon, "EyeSlash");
export const FilmSlate = icon(Film01Icon, "FilmSlate");
export const ForkKnife = icon(Restaurant01Icon, "ForkKnife");
export const GameController = icon(GameController01Icon, "GameController");
export const GasPump = icon(FuelStationIcon, "GasPump");
export const GearSix = icon(Settings02Icon, "GearSix");
export const Gift = icon(GiftIcon, "Gift");
export const GitBranch = icon(GitBranchIcon, "GitBranch");
export const Globe = icon(Globe02Icon, "Globe");
export const GraduationCap = icon(Mortarboard01Icon, "GraduationCap");
export const HandCoins = icon(HandCoinsIcon, "HandCoins");
export const Heartbeat = icon(Pulse01Icon, "Heartbeat");
export const House = icon(Home01Icon, "House");
export const Invoice = icon(Invoice01Icon, "Invoice");
export const Laptop = icon(LaptopIcon, "Laptop");
export const Lightning = icon(FlashIcon, "Lightning");
export const Lock = icon(LockIcon, "Lock");
export const MagnifyingGlass = icon(Search01Icon, "MagnifyingGlass");
export const Money = icon(Cash01Icon, "Money");
export const MusicNotes = icon(MusicNote03Icon, "MusicNotes");
export const Palette = icon(PaintBoardIcon, "Palette");
export const PencilSimple = icon(PencilEdit02Icon, "PencilSimple");
export const PiggyBank = icon(PiggyBankIcon, "PiggyBank");
export const Prohibit = icon(UnavailableIcon, "Prohibit");
export const Target = icon(Target01Icon, "Target");
export const Repeat = icon(RepeatIcon, "Repeat");
export const CheckmarkSquare = icon(CheckmarkSquare02Icon, "CheckmarkSquare");
export const Flag = icon(Flag01Icon, "Flag");
export const Bell = icon(Notification01Icon, "Bell");
export const Pill = icon(Medicine02Icon, "Pill");
export const Plus = icon(Add01Icon, "Plus");
export const Receipt = icon(Invoice03Icon, "Receipt");
export const Scissors = icon(Scissor01Icon, "Scissors");
export const Shapes = icon(ShapesIcon, "Shapes");
export const ShieldCheck = icon(ShieldCheckIcon, "ShieldCheck");
export const ShoppingBag = icon(ShoppingBag01Icon, "ShoppingBag");
export const ShoppingCart = icon(ShoppingCart01Icon, "ShoppingCart");
export const SignOut = icon(Logout03Icon, "SignOut");
export const SlidersHorizontal = icon(FilterHorizontalIcon, "SlidersHorizontal");
export const Stethoscope = icon(Stethoscope02Icon, "Stethoscope");
export const TShirt = icon(TShirtIcon, "TShirt");
export const Tag = icon(Tag01Icon, "Tag");
export const Ticket = icon(Ticket01Icon, "Ticket");
export const Train = icon(Train01Icon, "Train");
export const Trash = icon(Delete02Icon, "Trash");
export const TreePalm = icon(TreePalmIcon, "TreePalm");
export const TrendUp = icon(ChartIncreaseIcon, "TrendUp");
export const UserCircle = icon(UserCircleIcon, "UserCircle");
export const Wallet = icon(Wallet01Icon, "Wallet");
export const Warning = icon(Alert02Icon, "Warning");
export const WifiHigh = icon(Wifi01Icon, "WifiHigh");
export const Wrench = icon(Wrench01Icon, "Wrench");
