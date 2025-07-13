'use client';

import { useState } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem
} from "@heroui/dropdown";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  Logo,
} from "@/components/icons";

import { isInstalled, getAddress } from "@gemwallet/api"

export const Navbar = () => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  const [address, setAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      if (! await isInstalled()) {
        throw new Error("Gem wallet is not installed");
      }

      const address = await getAddress();

      if (!address || !address.result) {
        throw new Error("No address found");
      }

      setAddress(address.result.address);
    } catch (error) {
      console.error(error);
    } finally {
      onOpenChange();
    }
  }

  const handleDisconnect = () => {
    setAddress(null);
  }

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">BotFi</p>
          </NextLink>
        </NavbarBrand>
        <ul className="flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="basis-1/5"
        justify="end"
      >
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem>
          {address ? (
            <Dropdown>
              <DropdownTrigger>
              <Button>{address.slice(0, 6)}...{address.slice(-4)}</Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Static Actions">
                <DropdownItem key="disconnect" className="text-danger" color="danger" onPress={handleDisconnect}>Disconnect</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Button onPress={onOpen}>
              Connect
            </Button>
          )}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    Connect a wallet
                  </ModalHeader>
                  <ModalBody>
                    <Button onPress={handleConnect}>Gem wallet</Button>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" onPress={onClose}>
                      Close
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
