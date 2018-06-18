public static function fixKey($key) {
        
        if (strlen($key) < 16) {
            //0 pad to len 16
            return str_pad("$key", 16, "0"); 
        }
        
        if (strlen($key) > 16) {
            //truncate to 16 bytes
            return substr($str, 0, 16); 
        }
        return $key;
    }
    /**
    * Encrypt data using AES Cipher (CBC) with 128 bit key
    * 
    * @param type $key - key to use should be 16 bytes long (128 bits)
    * @param type $iv - initialization vector
    * @param type $data - data to encrypt
    * @return encrypted data in base64 encoding with iv attached at end after a :
    */

    
    public function aesEncryption($key, $data) {
    	$key = $this->fixKey($key);
    	 $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-128-cbc'));
        $encodedEncryptedData = base64_encode(openssl_encrypt($data,'aes-128-cbc',$key, OPENSSL_RAW_DATA, $iv));
        $encodedIV = base64_encode($iv);
        $encryptedPayload = $encodedEncryptedData.":".$encodedIV;
        return $encryptedPayload;
    }
    /**
    * Decrypt data using AES Cipher (CBC) with 128 bit key
    * 
    * @param type $key - key to use should be 16 bytes long (128 bits)
    * @param type $data - data to be decrypted in base64 encoding with iv attached at the end after a :
    * @return decrypted data
    */
    public function aesDecryption($key, $data) {
    	$key = $this->fixKey($key);
        $parts = explode(':', $data); //Separate Encrypted data from iv.
        $encrypted = $parts[0];
        $iv = $parts[1];
        $decryptedData = openssl_decrypt(base64_decode($encrypted),'aes-128-cbc',$key, OPENSSL_RAW_DATA, base64_decode($iv));
        return $decryptedData;
    }